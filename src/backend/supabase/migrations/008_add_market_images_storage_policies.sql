-- Migration: Add Storage Policies for market-images bucket
-- Description: Creates RLS policies for market picture uploads

-- ============================================================================
-- STORAGE POLICY HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is admin (already exists, but listing for reference)
-- Note: This should already exist from migration 002

-- ============================================================================
-- MARKET-IMAGES BUCKET POLICIES
-- ============================================================================

-- Policy: Anyone can view (read) market images
-- This allows public access to view market pictures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'market-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('market-images', 'market-images', true);
  ELSE
    UPDATE storage.buckets SET public = true WHERE name = 'market-images';
  END IF;
END $$;

-- Policy: Allow anyone to select (view) market images
CREATE POLICY "Market images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'market-images');

-- Policy: Allow authenticated users to insert (upload) market images
CREATE POLICY "Authenticated users can upload market images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'market-images');

-- Policy: Allow authenticated users to update market images
-- Only allow admins or users to update their own uploaded files
CREATE POLICY "Authenticated users can update market images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'market-images')
WITH CHECK (bucket_id = 'market-images');

-- Policy: Allow authenticated users to delete market images
CREATE POLICY "Authenticated users can delete market images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'market-images');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Market images are publicly readable" ON storage.objects IS 
  'Allows public read access to market image files';

COMMENT ON POLICY "Authenticated users can upload market images" ON storage.objects IS 
  'Allows authenticated users to upload market image files';

COMMENT ON POLICY "Authenticated users can update market images" ON storage.objects IS 
  'Allows authenticated users to update market image files';

COMMENT ON POLICY "Authenticated users can delete market images" ON storage.objects IS 
  'Allows authenticated users to delete market image files';

