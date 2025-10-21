-- Bloem Circular Fashion Marketplace Database Schema
-- Migration 005: Add hanger capacity fields to markets table

-- ============================================================================
-- ADD HANGER CAPACITY FIELDS TO MARKETS TABLE
-- ============================================================================

-- Add hanger capacity fields to markets table
ALTER TABLE markets 
ADD COLUMN max_hangers INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN current_hangers INTEGER DEFAULT 0 NOT NULL;

-- Add check constraint to ensure hanger counts are non-negative
ALTER TABLE markets 
ADD CONSTRAINT markets_max_hangers_check CHECK (max_hangers >= 0),
ADD CONSTRAINT markets_current_hangers_check CHECK (current_hangers >= 0);

-- Add check constraint to ensure current_hangers doesn't exceed max_hangers
ALTER TABLE markets 
ADD CONSTRAINT markets_hanger_capacity_check CHECK (current_hangers <= max_hangers);

-- ============================================================================
-- UPDATE EXISTING MARKETS WITH CALCULATED HANGER DATA
-- ============================================================================

-- Update existing markets with calculated hanger data from hanger_rentals
UPDATE markets 
SET 
  current_hangers = COALESCE(
    (SELECT SUM(hanger_count) 
     FROM hanger_rentals 
     WHERE hanger_rentals.market_id = markets.id), 
    0
  ),
  max_hangers = CASE 
    WHEN max_vendors > 0 THEN max_vendors * 2 -- Default: 2 hangers per vendor
    ELSE 0 
  END;

-- ============================================================================
-- CREATE FUNCTION TO UPDATE HANGER COUNTS
-- ============================================================================

-- Function to update market hanger counts when hanger rentals change
CREATE OR REPLACE FUNCTION update_market_hanger_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the market's current_hangers count
  UPDATE markets 
  SET current_hangers = (
    SELECT COALESCE(SUM(hanger_count), 0)
    FROM hanger_rentals 
    WHERE market_id = COALESCE(NEW.market_id, OLD.market_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.market_id, OLD.market_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER TO AUTOMATICALLY UPDATE HANGER COUNTS
-- ============================================================================

-- Create trigger to automatically update hanger counts when hanger_rentals change
CREATE TRIGGER update_market_hanger_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON hanger_rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_market_hanger_count();

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN markets.max_hangers IS 'Maximum number of hangers available for this market';
COMMENT ON COLUMN markets.current_hangers IS 'Current number of hangers rented for this market';

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create index on hanger-related fields for better query performance
CREATE INDEX idx_markets_hanger_capacity ON markets(max_hangers, current_hangers);

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Uncomment these queries to verify the migration worked correctly:
-- SELECT 
--   id, 
--   name, 
--   max_vendors, 
--   current_vendors, 
--   max_hangers, 
--   current_hangers,
--   hanger_price
-- FROM markets 
-- ORDER BY created_at DESC;

-- SELECT 
--   m.id,
--   m.name,
--   m.current_hangers,
--   COALESCE(SUM(hr.hanger_count), 0) as calculated_hangers
-- FROM markets m
-- LEFT JOIN hanger_rentals hr ON m.id = hr.market_id
-- GROUP BY m.id, m.name, m.current_hangers
-- ORDER BY m.created_at DESC;
