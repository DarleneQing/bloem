-- Migration 013: Per-seller hanger limit settings on markets

-- Add columns to configure whether sellers have unlimited hangers per market
-- and the maximum number of hangers per seller when not unlimited.

ALTER TABLE markets
ADD COLUMN IF NOT EXISTS unlimited_hangers_per_seller BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS max_hangers_per_seller INTEGER NOT NULL DEFAULT 5;

-- Ensure sensible bounds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'markets_max_hangers_per_seller_check'
  ) THEN
    ALTER TABLE markets
      ADD CONSTRAINT markets_max_hangers_per_seller_check
      CHECK (max_hangers_per_seller >= 1);
  END IF;
END $$;

COMMENT ON COLUMN markets.unlimited_hangers_per_seller IS 'If true, a seller can rent unlimited hangers for this market.';
COMMENT ON COLUMN markets.max_hangers_per_seller IS 'Maximum number of hangers a single seller can rent in this market when unlimited_hangers_per_seller = false.';


