-- Adjust unique constraint so cancelled rentals don't block new ones

-- Drop existing unique constraint/index if present (name may be index name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hanger_rentals_market_id_seller_id_key'
  ) THEN
    EXECUTE 'ALTER TABLE public.hanger_rentals DROP CONSTRAINT hanger_rentals_market_id_seller_id_key';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND n.nspname = 'public'
      AND c.relname = 'hanger_rentals_market_id_seller_id_key'
  ) THEN
    EXECUTE 'DROP INDEX public.hanger_rentals_market_id_seller_id_key';
  END IF;
END $$;

-- Create partial unique index that only applies to active (pending/confirmed) rentals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND n.nspname = 'public'
      AND c.relname = 'ux_hanger_rentals_market_seller_active'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX ux_hanger_rentals_market_seller_active ON public.hanger_rentals (market_id, seller_id) WHERE status IN (''PENDING'',''CONFIRMED'')';
  END IF;
END $$;





