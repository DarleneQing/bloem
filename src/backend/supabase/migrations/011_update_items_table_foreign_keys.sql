-- Migration 011: Update Items Table to Use Foreign Keys
-- Modifies items table to use foreign keys for brand, color, size, and adds subcategory

-- Step 1: Add new columns for foreign keys and gender
ALTER TABLE items 
  ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  ADD COLUMN color_id UUID REFERENCES colors(id) ON DELETE SET NULL,
  ADD COLUMN size_id UUID REFERENCES sizes(id) ON DELETE SET NULL,
  ADD COLUMN subcategory_id UUID REFERENCES item_subcategories(id) ON DELETE SET NULL,
  ADD COLUMN gender gender_type NOT NULL DEFAULT 'UNISEX';

-- Step 2: Migrate existing data from text fields to foreign keys
-- This will create the necessary brand/color entries if they don't exist

-- Migrate brands
INSERT INTO brands (name, is_system)
SELECT DISTINCT brand, FALSE
FROM items
WHERE brand IS NOT NULL 
  AND brand != ''
  AND brand NOT IN (SELECT name FROM brands)
ON CONFLICT (name) DO NOTHING;

UPDATE items i
SET brand_id = b.id
FROM brands b
WHERE i.brand = b.name
  AND i.brand IS NOT NULL;

-- Set brand_id to Unknown for items without brand
UPDATE items
SET brand_id = (SELECT id FROM brands WHERE name = 'Unknown')
WHERE brand IS NULL OR brand = '';

-- Migrate colors
INSERT INTO colors (name)
SELECT DISTINCT color
FROM items
WHERE color IS NOT NULL 
  AND color != ''
  AND color NOT IN (SELECT name FROM colors)
ON CONFLICT (name) DO NOTHING;

UPDATE items i
SET color_id = c.id
FROM colors c
WHERE i.color = c.name
  AND i.color IS NOT NULL;

-- Migrate sizes
-- Map existing enum values to size table entries
UPDATE items i
SET size_id = s.id
FROM sizes s
WHERE (
  CASE 
    WHEN i.size = 'XXS' THEN s.name = 'XXS'
    WHEN i.size = 'XS' THEN s.name = 'XS'
    WHEN i.size = 'S' THEN s.name = 'S'
    WHEN i.size = 'M' THEN s.name = 'M'
    WHEN i.size = 'L' THEN s.name = 'L'
    WHEN i.size = 'XL' THEN s.name = 'XL'
    WHEN i.size = 'XXL' THEN s.name = 'XXL'
    WHEN i.size = 'XXXL' THEN s.name = 'XXXL'
    WHEN i.size = 'ONE_SIZE' THEN s.name = 'ONE_SIZE'
    ELSE FALSE
  END
);

-- Step 3: Drop old text columns (after migration is verified)
ALTER TABLE items 
  DROP COLUMN brand,
  DROP COLUMN color,
  DROP COLUMN size;

-- Step 4: Drop old item_size enum (no longer needed)
DROP TYPE IF EXISTS item_size;

