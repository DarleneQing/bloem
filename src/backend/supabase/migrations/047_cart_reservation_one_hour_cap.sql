-- Cap cart reservations at 1 hour from reserved_at (anti-abuse).
-- Allows up to 3 extensions after the initial 15-minute block.

BEGIN;

ALTER TABLE cart_items
  DROP CONSTRAINT IF EXISTS cart_items_reservation_count_check;

ALTER TABLE cart_items
  ADD CONSTRAINT cart_items_reservation_count_check
  CHECK (reservation_count >= 1 AND reservation_count <= 4);

COMMENT ON COLUMN cart_items.reservation_count IS
  'Reservation periods used (1 = initial only; max 4 = initial + 3 extensions within 1h cap)';

CREATE OR REPLACE FUNCTION enforce_cart_item_reservation_max_duration()
RETURNS TRIGGER AS $$
DECLARE
  v_max_expires TIMESTAMP WITH TIME ZONE;
BEGIN
  v_max_expires := NEW.reserved_at + INTERVAL '1 hour';

  IF NEW.expires_at > v_max_expires THEN
    RAISE EXCEPTION 'Reservation cannot exceed 1 hour from reserved_at';
  END IF;

  IF NEW.expires_at <= NEW.reserved_at THEN
    RAISE EXCEPTION 'expires_at must be after reserved_at';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_cart_item_reservation_max_duration ON cart_items;

CREATE TRIGGER trigger_enforce_cart_item_reservation_max_duration
  BEFORE INSERT OR UPDATE OF expires_at, reserved_at ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION enforce_cart_item_reservation_max_duration();

COMMENT ON FUNCTION enforce_cart_item_reservation_max_duration() IS
  'Rejects cart_items rows where expires_at is more than 1 hour after reserved_at';

COMMIT;
