-- Migration 026: Fix hanger rental RPC function to ensure SECURITY DEFINER and better error handling
-- Ensures the function can properly access markets table even with RLS enabled

-- Recreate the function with SECURITY DEFINER in the definition
CREATE OR REPLACE FUNCTION rpc_create_hanger_rental(p_seller uuid, p_market uuid, p_count int)
RETURNS TABLE(id uuid, market_id uuid, seller_id uuid, hanger_count int, total_price numeric, status text, payment_confirmed_at timestamptz, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hanger_price numeric;
  v_unlimited boolean;
  v_max_per_seller int;
  v_max_hangers int;
  v_current_total int;
  v_seller_total int;
  v_market_status text;
  v_now timestamptz := NOW();
BEGIN
  IF p_count IS NULL OR p_count <= 0 THEN
    RAISE EXCEPTION 'Invalid hanger count' USING ERRCODE = '22023';
  END IF;

  -- Check if market exists and get status (SECURITY DEFINER bypasses RLS)
  SELECT m.status
  INTO v_market_status
  FROM public.markets m
  WHERE m.id = p_market;

  IF v_market_status IS NULL THEN
    RAISE EXCEPTION 'Market not found' USING ERRCODE = '40401';
  END IF;

  IF v_market_status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Market is not active' USING ERRCODE = '40401';
  END IF;

  -- Lock the market row for update
  PERFORM 1 FROM public.markets m WHERE m.id = p_market AND m.status = 'ACTIVE' FOR UPDATE;

  -- Ensure seller enrolled
  IF NOT EXISTS (
    SELECT 1 FROM public.market_enrollments me
    WHERE me.market_id = p_market AND me.seller_id = p_seller
  ) THEN
    RAISE EXCEPTION 'Seller not enrolled in market' USING ERRCODE = '42501';
  END IF;

  -- Fetch policy and pricing
  SELECT m.hanger_price, m.unlimited_hangers_per_seller, m.max_hangers_per_seller, m.max_hangers
  INTO v_hanger_price, v_unlimited, v_max_per_seller, v_max_hangers
  FROM public.markets AS m WHERE m.id = p_market;

  -- Per-seller limit (count both PENDING and CONFIRMED)
  IF NOT v_unlimited THEN
    SELECT COALESCE(SUM(hr.hanger_count), 0)
    INTO v_seller_total
    FROM public.hanger_rentals hr
    WHERE hr.market_id = p_market AND hr.seller_id = p_seller AND hr.status IN ('PENDING','CONFIRMED');

    IF v_seller_total + p_count > v_max_per_seller THEN
      RAISE EXCEPTION 'Per-seller hanger limit exceeded' USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Capacity check across market (count both PENDING and CONFIRMED)
  SELECT COALESCE(SUM(hr.hanger_count), 0)
  INTO v_current_total
  FROM public.hanger_rentals hr
  WHERE hr.market_id = p_market AND hr.status IN ('PENDING','CONFIRMED');

  IF v_current_total + p_count > v_max_hangers THEN
    RAISE EXCEPTION 'Market hanger capacity reached' USING ERRCODE = '23514';
  END IF;

  -- Insert pending rental with price snapshot
  RETURN QUERY
  WITH inserted AS (
    INSERT INTO public.hanger_rentals (market_id, seller_id, hanger_count, total_price, status, created_at, updated_at)
    VALUES (p_market, p_seller, p_count, (p_count * v_hanger_price), 'PENDING', v_now, v_now)
    RETURNING 
      public.hanger_rentals.id AS rental_id,
      public.hanger_rentals.market_id AS rental_market_id,
      public.hanger_rentals.seller_id AS rental_seller_id,
      public.hanger_rentals.hanger_count AS rental_hanger_count,
      public.hanger_rentals.total_price AS rental_total_price,
      public.hanger_rentals.status AS rental_status,
      public.hanger_rentals.payment_confirmed_at AS rental_payment_confirmed_at,
      public.hanger_rentals.created_at AS rental_created_at,
      public.hanger_rentals.updated_at AS rental_updated_at
  )
  SELECT i.rental_id, i.rental_market_id, i.rental_seller_id, i.rental_hanger_count, i.rental_total_price, i.rental_status, i.rental_payment_confirmed_at, i.rental_created_at, i.rental_updated_at
  FROM inserted i;
END;
$$;

