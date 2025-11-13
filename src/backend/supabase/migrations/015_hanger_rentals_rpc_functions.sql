-- Migration 015: RPC functions for hanger rentals (atomic capacity and per-seller limits)

-- Helper: determine if a user is ADMIN
CREATE OR REPLACE FUNCTION is_admin(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user AND role = 'ADMIN'
  );
$$;

-- Create rental
CREATE OR REPLACE FUNCTION rpc_create_hanger_rental(p_seller uuid, p_market uuid, p_count int)
RETURNS TABLE(id uuid, market_id uuid, seller_id uuid, hanger_count int, total_price numeric, status text, payment_confirmed_at timestamptz, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
  v_hanger_price numeric;
  v_unlimited boolean;
  v_max_per_seller int;
  v_max_hangers int;
  v_current_total int;
  v_seller_total int;
  v_now timestamptz := NOW();
BEGIN
  IF p_count IS NULL OR p_count <= 0 THEN
    RAISE EXCEPTION 'Invalid hanger count' USING ERRCODE = '22023';
  END IF;

  -- Market must exist and be ACTIVE; lock row for capacity check
  PERFORM 1 FROM public.markets AS m WHERE m.id = p_market AND m.status = 'ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Market not found or not active' USING ERRCODE = '40401';
  END IF;

  -- Ensure seller enrolled
  PERFORM 1 FROM public.market_enrollments AS me WHERE me.market_id = p_market AND me.seller_id = p_seller;
  IF NOT FOUND THEN
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
    FROM public.hanger_rentals AS hr
    WHERE hr.market_id = p_market AND hr.seller_id = p_seller AND hr.status IN ('PENDING','CONFIRMED');

    IF v_seller_total + p_count > v_max_per_seller THEN
      RAISE EXCEPTION 'Per-seller hanger limit exceeded' USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Capacity check across market (count both PENDING and CONFIRMED)
  SELECT COALESCE(SUM(hr.hanger_count), 0)
  INTO v_current_total
  FROM public.hanger_rentals AS hr
  WHERE hr.market_id = p_market AND hr.status IN ('PENDING','CONFIRMED');

  IF v_current_total + p_count > v_max_hangers THEN
    RAISE EXCEPTION 'Market hanger capacity reached' USING ERRCODE = '23514';
  END IF;

  -- Insert pending rental with price snapshot
  RETURN QUERY
  INSERT INTO public.hanger_rentals (market_id, seller_id, hanger_count, total_price, status, created_at, updated_at)
  VALUES (p_market, p_seller, p_count, (p_count * v_hanger_price), 'PENDING', v_now, v_now)
  RETURNING public.hanger_rentals.id,
            public.hanger_rentals.market_id,
            public.hanger_rentals.seller_id,
            public.hanger_rentals.hanger_count,
            public.hanger_rentals.total_price,
            public.hanger_rentals.status,
            public.hanger_rentals.payment_confirmed_at,
            public.hanger_rentals.created_at,
            public.hanger_rentals.updated_at;
END;
$$;

-- Update quantity
CREATE OR REPLACE FUNCTION rpc_update_hanger_rental_quantity(p_seller uuid, p_rental uuid, p_new_count int)
RETURNS TABLE(id uuid, market_id uuid, seller_id uuid, hanger_count int, total_price numeric, status text, payment_confirmed_at timestamptz, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
  v_market uuid;
  v_old_count int;
  v_hanger_price numeric;
  v_unlimited boolean;
  v_max_per_seller int;
  v_max_hangers int;
  v_market_current_total int;
  v_seller_total_excluding int;
  v_now timestamptz := NOW();
BEGIN
  IF p_new_count IS NULL OR p_new_count <= 0 THEN
    RAISE EXCEPTION 'Invalid hanger count' USING ERRCODE = '22023';
  END IF;

  -- Fetch and lock rental row (must be owned by seller and PENDING)
  SELECT hr.market_id, hr.hanger_count
  INTO v_market, v_old_count
  FROM hanger_rentals AS hr
  WHERE hr.id = p_rental AND hr.seller_id = p_seller AND hr.status = 'PENDING'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental not found or not editable' USING ERRCODE = '40401';
  END IF;

  -- Lock market
  PERFORM 1 FROM public.markets AS m WHERE m.id = v_market FOR UPDATE;

  -- Fetch policy and pricing
  SELECT m.hanger_price, m.unlimited_hangers_per_seller, m.max_hangers_per_seller, m.max_hangers
  INTO v_hanger_price, v_unlimited, v_max_per_seller, v_max_hangers
  FROM public.markets AS m WHERE m.id = v_market;

  -- Per-seller limit with excluding current rental
  IF NOT v_unlimited THEN
    SELECT COALESCE(SUM(hr2.hanger_count), 0)
    INTO v_seller_total_excluding
    FROM hanger_rentals AS hr2
    WHERE hr2.market_id = v_market AND hr2.seller_id = p_seller AND hr2.status IN ('PENDING','CONFIRMED') AND hr2.id <> p_rental;

    IF v_seller_total_excluding + p_new_count > v_max_per_seller THEN
      RAISE EXCEPTION 'Per-seller hanger limit exceeded' USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Market capacity check with delta
  SELECT COALESCE(SUM(hr.hanger_count), 0)
  INTO v_market_current_total
  FROM public.hanger_rentals AS hr
  WHERE hr.market_id = v_market AND hr.status IN ('PENDING','CONFIRMED');

  IF (v_market_current_total - v_old_count + p_new_count) > v_max_hangers THEN
    RAISE EXCEPTION 'Market hanger capacity reached' USING ERRCODE = '23514';
  END IF;

  -- Update
  RETURN QUERY
  UPDATE hanger_rentals AS hr
  SET hanger_count = p_new_count,
      total_price = (p_new_count * v_hanger_price),
      updated_at = v_now
  WHERE hr.id = p_rental
  RETURNING hr.id, hr.market_id, hr.seller_id, hr.hanger_count, hr.total_price, hr.status, hr.payment_confirmed_at, hr.created_at, hr.updated_at;
END;
$$;

-- Cancel rental
CREATE OR REPLACE FUNCTION rpc_cancel_hanger_rental(p_seller uuid, p_rental uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only cancel if owned and still PENDING
  UPDATE hanger_rentals AS hr
  SET status = 'CANCELLED', updated_at = NOW()
  WHERE hr.id = p_rental AND hr.seller_id = p_seller AND hr.status = 'PENDING';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental not found or not cancellable' USING ERRCODE = '40401';
  END IF;
END;
$$;


