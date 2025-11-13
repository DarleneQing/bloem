-- Migration 010: Item Attribute Tables
-- Creates tables for brands, colors, sizes, and item_subcategories with foreign key references

-- ============================================================================
-- GENDER ENUM
-- ============================================================================
CREATE TYPE gender_type AS ENUM ('MEN', 'WOMEN', 'UNISEX');

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_by_user UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_system BOOLEAN DEFAULT FALSE NOT NULL
);

-- ============================================================================
-- COLORS TABLE
-- ============================================================================
CREATE TABLE colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  hex_code TEXT
);

-- ============================================================================
-- SIZES TABLE
-- ============================================================================
CREATE TABLE sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  size_type TEXT NOT NULL CHECK (size_type IN ('letter', 'numeric', 'eu_shoe')),
  display_order INTEGER DEFAULT 0
);

-- ============================================================================
-- ITEM SUBCATEGORIES TABLE
-- ============================================================================
CREATE TABLE item_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category item_category NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(category, name)
);

-- ============================================================================
-- SEED DEFAULT BRANDS
-- ============================================================================
INSERT INTO brands (name, is_system) VALUES 
  ('Unknown', TRUE);

-- ============================================================================
-- SEED DEFAULT COLORS
-- ============================================================================
INSERT INTO colors (name, hex_code) VALUES
  ('Black', '#000000'),
  ('White', '#FFFFFF'),
  ('Gray', '#808080'),
  ('Navy', '#000080'),
  ('Beige', '#F5F5DC'),
  ('Brown', '#A52A2A'),
  ('Red', '#FF0000'),
  ('Blue', '#0000FF'),
  ('Green', '#008000'),
  ('Yellow', '#FFFF00'),
  ('Pink', '#FFC0CB'),
  ('Purple', '#800080'),
  ('Orange', '#FFA500'),
  ('Khaki', '#C3B091');

-- ============================================================================
-- SEED DEFAULT SIZES
-- ============================================================================
-- Letter sizes
INSERT INTO sizes (name, size_type, display_order) VALUES
  ('XXS', 'letter', 1),
  ('XS', 'letter', 2),
  ('S', 'letter', 3),
  ('M', 'letter', 4),
  ('L', 'letter', 5),
  ('XL', 'letter', 6),
  ('XXL', 'letter', 7),
  ('XXXL', 'letter', 8),
  ('ONE_SIZE', 'letter', 9);

-- Numeric sizes
INSERT INTO sizes (name, size_type, display_order) VALUES
  ('26', 'numeric', 10),
  ('28', 'numeric', 11),
  ('30', 'numeric', 12),
  ('32', 'numeric', 13),
  ('34', 'numeric', 14),
  ('36', 'numeric', 15),
  ('38', 'numeric', 16),
  ('40', 'numeric', 17),
  ('42', 'numeric', 18),
  ('44', 'numeric', 19),
  ('46', 'numeric', 20),
  ('48', 'numeric', 21);

-- EU Shoe sizes
INSERT INTO sizes (name, size_type, display_order) VALUES
  ('EU35', 'eu_shoe', 22),
  ('EU36', 'eu_shoe', 23),
  ('EU37', 'eu_shoe', 24),
  ('EU38', 'eu_shoe', 25),
  ('EU39', 'eu_shoe', 26),
  ('EU40', 'eu_shoe', 27),
  ('EU41', 'eu_shoe', 28),
  ('EU42', 'eu_shoe', 29),
  ('EU43', 'eu_shoe', 30),
  ('EU44', 'eu_shoe', 31),
  ('EU45', 'eu_shoe', 32),
  ('EU46', 'eu_shoe', 33);

-- ============================================================================
-- SEED DEFAULT SUBCATEGORIES BY CATEGORY
-- ============================================================================

-- TOPS subcategories
INSERT INTO item_subcategories (category, name) VALUES
  ('TOPS', 'T-Shirt'),
  ('TOPS', 'Shirt'),
  ('TOPS', 'Blouse'),
  ('TOPS', 'Tank Top'),
  ('TOPS', 'Sweater'),
  ('TOPS', 'Cardigan'),
  ('TOPS', 'Hoodie'),
  ('TOPS', 'Jacket'),
  ('TOPS', 'Blazer'),
  ('TOPS', 'Coat');

-- BOTTOMS subcategories
INSERT INTO item_subcategories (category, name) VALUES
  ('BOTTOMS', 'Jeans'),
  ('BOTTOMS', 'Trousers'),
  ('BOTTOMS', 'Leggings'),
  ('BOTTOMS', 'Shorts'),
  ('BOTTOMS', 'Skirt'),
  ('BOTTOMS', 'Sweatpants');

-- DRESSES subcategories
INSERT INTO item_subcategories (category, name) VALUES
  ('DRESSES', 'Casual Dress'),
  ('DRESSES', 'Party Dress'),
  ('DRESSES', 'Evening Dress'),
  ('DRESSES', 'Summer Dress'),
  ('DRESSES', 'Maxi Dress'),
  ('DRESSES', 'Midi Dress'),
  ('DRESSES', 'Mini Dress');

-- OUTERWEAR subcategories
INSERT INTO item_subcategories (category, name) VALUES
  ('OUTERWEAR', 'Coat'),
  ('OUTERWEAR', 'Winter Jacket'),
  ('OUTERWEAR', 'Leather Jacket'),
  ('OUTERWEAR', 'Denim Jacket'),
  ('OUTERWEAR', 'Blazer'),
  ('OUTERWEAR', 'Cardigan'),
  ('OUTERWEAR', 'Windbreaker'),
  ('OUTERWEAR', 'Raincoat');

-- SHOES subcategories
INSERT INTO item_subcategories (category, name) VALUES
  ('SHOES', 'Sneakers'),
  ('SHOES', 'Boots'),
  ('SHOES', 'Heels'),
  ('SHOES', 'Sandals'),
  ('SHOES', 'Flats'),
  ('SHOES', 'Loafers'),
  ('SHOES', 'Ankle Boots'),
  ('SHOES', 'Oxfords');

-- ACCESSORIES subcategories
INSERT INTO item_subcategories (category, name) VALUES
  ('ACCESSORIES', 'Scarf'),
  ('ACCESSORIES', 'Hat'),
  ('ACCESSORIES', 'Belt'),
  ('ACCESSORIES', 'Gloves'),
  ('ACCESSORIES', 'Sunglasses'),
  ('ACCESSORIES', 'Watch');

-- BAGS subcategories
INSERT INTO item_subcategories (category, name) VALUES
  ('BAGS', 'Handbag'),
  ('BAGS', 'Backpack'),
  ('BAGS', 'Tote Bag'),
  ('BAGS', 'Crossbody'),
  ('BAGS', 'Clutch'),
  ('BAGS', 'Shoulder Bag'),
  ('BAGS', 'Messenger Bag');

-- JEWELRY subcategories
INSERT INTO item_subcategories (category, name) VALUES
  ('JEWELRY', 'Necklace'),
  ('JEWELRY', 'Earrings'),
  ('JEWELRY', 'Bracelet'),
  ('JEWELRY', 'Ring'),
  ('JEWELRY', 'Brooch');

-- OTHER subcategories
INSERT INTO item_subcategories (category, name) VALUES
  ('OTHER', 'Swimwear'),
  ('OTHER', 'Activewear'),
  ('OTHER', 'Lingerie'),
  ('OTHER', 'Underwear');

