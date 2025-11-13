-- Bloem Circular Fashion Marketplace Schema Update
-- Migration 009: Make description optional in items table

-- Make description field nullable
ALTER TABLE items 
  ALTER COLUMN description DROP NOT NULL;

COMMENT ON COLUMN items.description IS 'Item description - optional field';
