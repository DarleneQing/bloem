-- Migration 045: Fix items stuck RESERVED after cart removal
--
-- return_item_to_rack_on_cart_removal() runs when a buyer deletes cart_items,
-- but buyers cannot UPDATE items under RLS (owner/admin only). The trigger
-- silently updated zero rows, leaving items RESERVED with no cart_items row.

CREATE OR REPLACE FUNCTION return_item_to_rack_on_cart_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE items
  SET status = 'RACK',
      updated_at = NOW()
  WHERE id = OLD.item_id
    AND status = 'RESERVED';

  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION return_item_to_rack_on_cart_removal() IS
  'Returns RESERVED items to RACK when removed from cart. SECURITY DEFINER so buyers can release reservations under RLS.';

-- One-time repair for rows already orphaned before this migration.
CREATE OR REPLACE FUNCTION reconcile_orphaned_reserved_items()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE items i
  SET status = 'RACK',
      updated_at = NOW()
  WHERE i.status = 'RESERVED'
    AND NOT EXISTS (
      SELECT 1
      FROM cart_items ci
      WHERE ci.item_id = i.id
    );

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION reconcile_orphaned_reserved_items() IS
  'Sets RESERVED items back to RACK when they have no cart_items row (stale reservation).';

SELECT reconcile_orphaned_reserved_items();

-- Heal a single item before reserve when a prior removal left it stuck.
CREATE OR REPLACE FUNCTION rpc_reserve_cart_item(p_item_id UUID)
RETURNS TABLE (
  cart_item_id UUID,
  cart_id UUID,
  item_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_item_status item_status;
  v_item_owner UUID;
  v_cart_id UUID;
  v_cart_item_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_expires_at TIMESTAMP WITH TIME ZONE := v_now + INTERVAL '15 minutes';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT status, owner_id
    INTO v_item_status, v_item_owner
  FROM items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'item_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_item_owner = v_user_id THEN
    RAISE EXCEPTION 'cannot_reserve_own_item' USING ERRCODE = '22023';
  END IF;

  -- Release stale RESERVED rows with no active cart reservation.
  IF v_item_status = 'RESERVED'
     AND NOT EXISTS (
       SELECT 1 FROM cart_items ci WHERE ci.item_id = p_item_id
     ) THEN
    UPDATE items
    SET status = 'RACK',
        updated_at = v_now
    WHERE id = p_item_id;
    v_item_status := 'RACK';
  END IF;

  IF v_item_status <> 'RACK' THEN
    RAISE EXCEPTION 'item_not_available:%', v_item_status USING ERRCODE = '22023';
  END IF;

  INSERT INTO carts (user_id, updated_at)
  VALUES (v_user_id, v_now)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = v_now
  RETURNING id INTO v_cart_id;

  INSERT INTO cart_items (cart_id, item_id, reserved_at, expires_at, reservation_count)
  VALUES (v_cart_id, p_item_id, v_now, v_expires_at, 1)
  RETURNING id INTO v_cart_item_id;

  UPDATE items
  SET status = 'RESERVED', updated_at = v_now
  WHERE id = p_item_id;

  RETURN QUERY SELECT v_cart_item_id, v_cart_id, p_item_id, v_expires_at;
END;
$$;
