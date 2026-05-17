-- Seller application details on market_enrollments + admin RLS + photo storage.

ALTER TABLE public.market_enrollments
  ADD COLUMN IF NOT EXISTS style_photo_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_media_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS item_count integer,
  ADD COLUMN IF NOT EXISTS item_count_range text,
  ADD COLUMN IF NOT EXISTS brand_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS wants_to_volunteer boolean NOT NULL DEFAULT false;

ALTER TABLE public.market_enrollments
  ADD CONSTRAINT market_enrollments_item_count_positive
  CHECK (item_count IS NULL OR item_count > 0);

-- Admins can read and update enrollments for review.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'market_enrollments'
      AND policyname = 'admin_select_enrollments'
  ) THEN
    CREATE POLICY admin_select_enrollments
      ON public.market_enrollments
      FOR SELECT
      USING (is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'market_enrollments'
      AND policyname = 'admin_update_enrollments'
  ) THEN
    CREATE POLICY admin_update_enrollments
      ON public.market_enrollments
      FOR UPDATE
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;

-- Sellers can update their own enrollment application payload (resubmit / edit while pending).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'market_enrollments'
      AND policyname = 'owner_update_enrollments'
  ) THEN
    CREATE POLICY owner_update_enrollments
      ON public.market_enrollments
      FOR UPDATE
      USING (seller_id = auth.uid())
      WITH CHECK (seller_id = auth.uid());
  END IF;
END $$;

-- Storage: seller-application-photos (public read for admin review UI).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'seller-application-photos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('seller-application-photos', 'seller-application-photos', true);
  ELSE
    UPDATE storage.buckets SET public = true WHERE name = 'seller-application-photos';
  END IF;
END $$;

DROP POLICY IF EXISTS "Seller application photos are publicly readable" ON storage.objects;
CREATE POLICY "Seller application photos are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'seller-application-photos');

DROP POLICY IF EXISTS "Sellers can upload own application photos" ON storage.objects;
CREATE POLICY "Sellers can upload own application photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'seller-application-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Sellers can delete own application photos" ON storage.objects;
CREATE POLICY "Sellers can delete own application photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'seller-application-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
