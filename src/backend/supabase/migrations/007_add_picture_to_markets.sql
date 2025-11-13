-- Migration: Add picture field to markets table
-- Description: Adds an optional picture_url field to store market logo/images
-- Default: Uses brand-transparent.png as the default image

ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS picture_url TEXT DEFAULT '/assets/images/brand-transparent.png';

-- Add comment to the column
COMMENT ON COLUMN markets.picture_url IS 'URL to the market logo/image, defaults to brand-transparent.png';

