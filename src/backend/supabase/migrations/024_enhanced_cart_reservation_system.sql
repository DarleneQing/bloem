-- Enhanced Cart Reservation System
-- Migration 024: Add RESERVED status, reservation metadata, triggers, and constraints

-- Step 1: Add RESERVED status to item_status enum
-- This MUST be done in its own transaction and committed before use
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'RESERVED' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'item_status')
  ) THEN
    ALTER TYPE item_status ADD VALUE 'RESERVED';
  END IF;
END $$;

-- Force a commit point by ending any implicit transaction
COMMIT;

-- Step 2: Add remaining schema changes in a new transaction
BEGIN;

-- Add reservation metadata to cart_items
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS reservation_count INTEGER DEFAULT 1 CHECK (reservation_count >= 1 AND reservation_count <= 3),
  ADD COLUMN IF NOT EXISTS last_extended_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS auto_removed BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN cart_items.reservation_count IS 'Number of times reservation has been extended (max 2 extensions = 3 total)';
COMMENT ON COLUMN cart_items.last_extended_at IS 'Timestamp of last reservation extension';
COMMENT ON COLUMN cart_items.auto_removed IS 'Whether item was automatically removed due to expiry';

-- Add indexes for performance
-- Note: Cannot use NOW() in index predicate as it's not IMMUTABLE
-- Using partial index without time-based predicate
CREATE INDEX IF NOT EXISTS idx_cart_items_expires_at 
  ON cart_items(expires_at);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id_expires_at 
  ON cart_items(cart_id, expires_at);

-- Create index for items by status and market
-- Note: Not using WHERE clause with RESERVED to avoid enum value issues
-- The index will still be useful for filtering by any status
CREATE INDEX IF NOT EXISTS idx_items_status_market 
  ON items(status, market_id);

-- Function to automatically return items to RACK on cart_item deletion
CREATE OR REPLACE FUNCTION return_item_to_rack_on_cart_removal()
RETURNS TRIGGER AS $$
BEGIN
  -- Update item back to RACK if it was RESERVED
  UPDATE items
  SET status = 'RACK',
      updated_at = NOW()
  WHERE id = OLD.item_id
    AND status = 'RESERVED';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-return items to RACK
DROP TRIGGER IF EXISTS trigger_return_item_to_rack ON cart_items;
CREATE TRIGGER trigger_return_item_to_rack
  BEFORE DELETE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION return_item_to_rack_on_cart_removal();

-- Function to prevent adding SOLD or RESERVED items to cart
CREATE OR REPLACE FUNCTION validate_cart_item_addition()
RETURNS TRIGGER AS $$
DECLARE
  item_current_status item_status;
BEGIN
  -- Check if item exists and get its status
  SELECT status INTO item_current_status
  FROM items
  WHERE id = NEW.item_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;
  
  -- Only allow adding items with RACK status
  IF item_current_status != 'RACK' THEN
    RAISE EXCEPTION 'Item is not available for reservation (status: %)', item_current_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate cart additions
DROP TRIGGER IF EXISTS trigger_validate_cart_addition ON cart_items;
CREATE TRIGGER trigger_validate_cart_addition
  BEFORE INSERT ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_cart_item_addition();

-- Function to automatically set expires_at if not provided
CREATE OR REPLACE FUNCTION set_cart_item_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expires_at to 15 minutes from reserved_at if not already set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.reserved_at + INTERVAL '15 minutes';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set expiry time
DROP TRIGGER IF EXISTS trigger_set_cart_item_expiry ON cart_items;
CREATE TRIGGER trigger_set_cart_item_expiry
  BEFORE INSERT ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION set_cart_item_expiry();

COMMIT;

-- Add helpful comments
COMMENT ON FUNCTION return_item_to_rack_on_cart_removal() IS 'Automatically returns reserved items to RACK status when removed from cart';
COMMENT ON FUNCTION validate_cart_item_addition() IS 'Ensures only RACK status items can be added to cart';
COMMENT ON FUNCTION set_cart_item_expiry() IS 'Automatically sets expiry time to 15 minutes from reservation time';

