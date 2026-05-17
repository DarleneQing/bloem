-- Market enrollment application workflow: PENDING review → APPROVED (or REJECTED).

DO $$ BEGIN
  CREATE TYPE market_enrollment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.market_enrollments
  ADD COLUMN IF NOT EXISTS status market_enrollment_status NOT NULL DEFAULT 'APPROVED';

-- Existing rows stay APPROVED; new seller applications default to PENDING.
ALTER TABLE public.market_enrollments
  ALTER COLUMN status SET DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS idx_market_enrollments_market_status
  ON public.market_enrollments (market_id, status);

-- Hanger rentals require an approved enrollment.
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

  PERFORM 1 FROM public.markets m WHERE m.id = p_market AND m.status = 'ACTIVE' FOR UPDATE;

  IF NOT EXISTS (
    SELECT 1 FROM public.market_enrollments me
    WHERE me.market_id = p_market
      AND me.seller_id = p_seller
      AND me.status = 'APPROVED'
  ) THEN
    RAISE EXCEPTION 'Seller enrollment not approved for this market' USING ERRCODE = '42501';
  END IF;

  SELECT m.hanger_price, m.unlimited_hangers_per_seller, m.max_hangers_per_seller, m.max_hangers
  INTO v_hanger_price, v_unlimited, v_max_per_seller, v_max_hangers
  FROM public.markets AS m WHERE m.id = p_market;

  IF NOT v_unlimited THEN
    SELECT COALESCE(SUM(hr.hanger_count), 0)
    INTO v_seller_total
    FROM public.hanger_rentals hr
    WHERE hr.market_id = p_market AND hr.seller_id = p_seller AND hr.status IN ('PENDING','CONFIRMED');

    IF v_seller_total + p_count > v_max_per_seller THEN
      RAISE EXCEPTION 'Per-seller hanger limit exceeded' USING ERRCODE = '23514';
    END IF;
  END IF;

  SELECT COALESCE(SUM(hr.hanger_count), 0)
  INTO v_current_total
  FROM public.hanger_rentals hr
  WHERE hr.market_id = p_market AND hr.status IN ('PENDING','CONFIRMED');

  IF v_current_total + p_count > v_max_hangers THEN
    RAISE EXCEPTION 'Market hanger capacity reached' USING ERRCODE = '23514';
  END IF;

  RETURN QUERY
  INSERT INTO public.hanger_rentals (market_id, seller_id, hanger_count, total_price, status, created_at, updated_at)
  VALUES (p_market, p_seller, p_count, v_hanger_price * p_count, 'PENDING', v_now, v_now)
  RETURNING hanger_rentals.id, hanger_rentals.market_id, hanger_rentals.seller_id, hanger_rentals.hanger_count,
            hanger_rentals.total_price, hanger_rentals.status, hanger_rentals.payment_confirmed_at,
            hanger_rentals.created_at, hanger_rentals.updated_at;
END;
$$;
