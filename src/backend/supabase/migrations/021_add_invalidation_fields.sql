-- Add Invalidation Fields to QR Codes
-- Migration 021: Add invalidation tracking to qr_codes table

-- Add invalidation fields
ALTER TABLE qr_codes
  ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS invalidation_reason TEXT;

-- Add index for batch_id and status queries (for statistics)
CREATE INDEX IF NOT EXISTS idx_qr_codes_batch_id_status ON qr_codes(batch_id, status);

-- Add index for invalidated codes
CREATE INDEX IF NOT EXISTS idx_qr_codes_invalidated ON qr_codes(invalidated_at) WHERE invalidated_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN qr_codes.invalidated_at IS 'Timestamp when the QR code was invalidated (null if not invalidated)';
COMMENT ON COLUMN qr_codes.invalidation_reason IS 'Reason for QR code invalidation (e.g., "Market closed: COMPLETED", "Damaged label", etc.)';

