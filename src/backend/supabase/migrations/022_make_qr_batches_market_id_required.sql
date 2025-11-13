-- Make market_id required for QR batches
-- Migration 022: Make market_id NOT NULL in qr_batches table

-- First, delete any existing batches without a market_id (if any exist)
-- This is safe since QR code batches should always be associated with a market
DELETE FROM qr_batches WHERE market_id IS NULL;

-- Now make market_id NOT NULL
ALTER TABLE qr_batches
  ALTER COLUMN market_id SET NOT NULL;

-- Update the unique constraint to remove the market_id null handling
-- The constraint already ensures uniqueness per market
-- No change needed to the constraint itself since it already handles this

-- Update the comment to reflect that market_id is required
COMMENT ON COLUMN qr_batches.market_id IS 'Market ID (required) - all QR code batches must be associated with a market';


