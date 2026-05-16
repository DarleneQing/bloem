-- Migration 034: Fix update_market_vendor_count trigger
--
-- The original (migration 001) only fires on INSERT and DELETE. When a
-- hanger_rental transitions PENDING/CONFIRMED → CANCELLED via UPDATE, the
-- counter is never decremented, so markets.current_vendors drifts upward
-- forever and eventually blocks new enrollments by hitting max_vendors.
--
-- New semantics: current_vendors counts the number of non-CANCELLED rentals
-- against the market.

CREATE OR REPLACE FUNCTION update_market_vendor_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'CANCELLED' THEN
      UPDATE markets
      SET current_vendors = current_vendors + 1
      WHERE id = NEW.market_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'CANCELLED' THEN
      UPDATE markets
      SET current_vendors = current_vendors - 1
      WHERE id = OLD.market_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Status transition: cancelled <-> not cancelled
    IF OLD.status <> 'CANCELLED' AND NEW.status = 'CANCELLED' THEN
      UPDATE markets
      SET current_vendors = current_vendors - 1
      WHERE id = OLD.market_id;
    ELSIF OLD.status = 'CANCELLED' AND NEW.status <> 'CANCELLED' THEN
      UPDATE markets
      SET current_vendors = current_vendors + 1
      WHERE id = NEW.market_id;
    END IF;

    -- Rental moved to a different market while still active
    IF NEW.market_id <> OLD.market_id
       AND OLD.status <> 'CANCELLED'
       AND NEW.status <> 'CANCELLED' THEN
      UPDATE markets
      SET current_vendors = current_vendors - 1
      WHERE id = OLD.market_id;
      UPDATE markets
      SET current_vendors = current_vendors + 1
      WHERE id = NEW.market_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_vendor_count_on_rental ON hanger_rentals;
CREATE TRIGGER update_vendor_count_on_rental
  AFTER INSERT OR UPDATE OR DELETE ON hanger_rentals
  FOR EACH ROW
  EXECUTE FUNCTION update_market_vendor_count();

-- One-shot reconciliation to repair drift from before this migration.
-- Recompute current_vendors from the source of truth.
UPDATE markets m
SET current_vendors = COALESCE(sub.cnt, 0)
FROM (
  SELECT market_id, COUNT(*) AS cnt
  FROM hanger_rentals
  WHERE status <> 'CANCELLED'
  GROUP BY market_id
) sub
WHERE m.id = sub.market_id;

-- Markets with zero active rentals — reset stale counters too.
UPDATE markets
SET current_vendors = 0
WHERE id NOT IN (
  SELECT DISTINCT market_id
  FROM hanger_rentals
  WHERE status <> 'CANCELLED'
);
