-- Migration 023: Add purchase_price column to items table

BEGIN;

ALTER TABLE items
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2);

COMMENT ON COLUMN items.purchase_price IS 'Original purchase price of the item (optional)';

COMMIT;

