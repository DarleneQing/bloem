-- Ensure RLS and policies for sellers to manage their own market enrollments

-- Enable RLS (safe if already enabled)
ALTER TABLE public.market_enrollments ENABLE ROW LEVEL SECURITY;

-- Sellers can select their own enrollments (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'market_enrollments'
      AND policyname = 'owner_select_enrollments'
  ) THEN
    CREATE POLICY owner_select_enrollments
      ON public.market_enrollments
      FOR SELECT
      USING (seller_id = auth.uid());
  END IF;
END $$;

-- Sellers can insert their own enrollments (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'market_enrollments'
      AND policyname = 'owner_insert_enrollments'
  ) THEN
    CREATE POLICY owner_insert_enrollments
      ON public.market_enrollments
      FOR INSERT
      WITH CHECK (seller_id = auth.uid());
  END IF;
END $$;

-- Sellers can delete their own enrollments (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'market_enrollments'
      AND policyname = 'owner_delete_enrollments'
  ) THEN
    CREATE POLICY owner_delete_enrollments
      ON public.market_enrollments
      FOR DELETE
      USING (seller_id = auth.uid());
  END IF;
END $$;


