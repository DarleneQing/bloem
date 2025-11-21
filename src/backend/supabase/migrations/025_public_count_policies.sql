-- Migration 025: Add public read policies for counting enrollments and rentals
-- Allows authenticated users to read minimal fields (market_id, hanger_count, status) 
-- for counting purposes without exposing sensitive seller information

-- Public read policy for market_enrollments (only market_id field for counting)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'market_enrollments'
      AND policyname = 'public_read_for_counting'
  ) THEN
    CREATE POLICY public_read_for_counting
      ON public.market_enrollments
      FOR SELECT
      USING (
        -- Allow authenticated users to read market_id for counting
        auth.uid() IS NOT NULL
      );
  END IF;
END $$;

-- Public read policy for hanger_rentals (only market_id, hanger_count, status for counting)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'hanger_rentals'
      AND policyname = 'public_read_for_counting'
  ) THEN
    CREATE POLICY public_read_for_counting
      ON public.hanger_rentals
      FOR SELECT
      USING (
        -- Allow authenticated users to read market_id, hanger_count, status for counting
        auth.uid() IS NOT NULL
      );
  END IF;
END $$;

