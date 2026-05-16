-- Migration 029: Atomic cart reservation RPC
-- Closes the race between the cart_items INSERT and the items.status UPDATE in
-- app/api/carts/items/route.ts. Two concurrent requests can both read `RACK`
-- and both pass the trigger validation; the UNIQUE(item_id) constraint on
-- cart_items is the only guard, and the loser sees a 23505 instead of a clean
-- business error. This RPC holds a row-level lock on the item for the whole
-- transaction, so the second caller blocks until the first commits and then
-- reads the new RESERVED status.

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

  -- Lock the item row for the duration of this transaction.
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

  IF v_item_status <> 'RACK' THEN
    RAISE EXCEPTION 'item_not_available:%', v_item_status USING ERRCODE = '22023';
  END IF;

  -- Idempotent cart upsert.
  INSERT INTO carts (user_id, updated_at)
  VALUES (v_user_id, v_now)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = v_now
  RETURNING id INTO v_cart_id;

  -- Insert cart_items. The validate_cart_item_addition trigger will re-read
  -- items.status, but because we hold a row lock above, no concurrent
  -- transaction has been able to change it.
  INSERT INTO cart_items (cart_id, item_id, reserved_at, expires_at, reservation_count)
  VALUES (v_cart_id, p_item_id, v_now, v_expires_at, 1)
  RETURNING id INTO v_cart_item_id;

  -- Flip item status under the same lock.
  UPDATE items
  SET status = 'RESERVED', updated_at = v_now
  WHERE id = p_item_id;

  RETURN QUERY SELECT v_cart_item_id, v_cart_id, p_item_id, v_expires_at;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_reserve_cart_item(UUID) TO authenticated;

COMMENT ON FUNCTION rpc_reserve_cart_item(UUID) IS
  'Atomically reserves a RACK item for the caller: upserts the cart, inserts cart_items, and flips items.status to RESERVED, all under a row-level lock on items.';
