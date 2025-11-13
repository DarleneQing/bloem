-- QR Batches Table
-- Migration 020: Create qr_batches table for batch management

CREATE TABLE IF NOT EXISTS qr_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Batch identification
  name TEXT, -- Optional batch name for admin reference
  prefix TEXT NOT NULL, -- Prefix used in QR codes (e.g., "MARKET01")
  
  -- Market association (optional - batches can be market-specific or general)
  market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  
  -- Batch details
  code_count INTEGER NOT NULL CHECK (code_count > 0 AND code_count <= 500),
  
  -- Creator
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure unique prefix per market (or globally if market_id is null)
  CONSTRAINT uq_qr_batches_prefix_market UNIQUE (prefix, market_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qr_batches_market_id ON qr_batches(market_id) WHERE market_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qr_batches_prefix ON qr_batches(prefix);
CREATE INDEX IF NOT EXISTS idx_qr_batches_created_by ON qr_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_qr_batches_created_at ON qr_batches(created_at DESC);

-- Update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_qr_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_qr_batches_updated_at
  BEFORE UPDATE ON qr_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_batches_updated_at();

-- Add foreign key constraint from qr_codes to qr_batches if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'qr_codes_batch_id_fkey'
  ) THEN
    ALTER TABLE qr_codes
      ADD CONSTRAINT qr_codes_batch_id_fkey
      FOREIGN KEY (batch_id) REFERENCES qr_batches(id) ON DELETE RESTRICT;
  END IF;
END $$;

