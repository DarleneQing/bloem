-- Migration 017: Set RPC functions to SECURITY DEFINER to bypass RLS checks

ALTER FUNCTION rpc_create_hanger_rental(uuid, uuid, int)
  SECURITY DEFINER
  SET search_path = public, extensions;

ALTER FUNCTION rpc_update_hanger_rental_quantity(uuid, uuid, int)
  SECURITY DEFINER
  SET search_path = public, extensions;

ALTER FUNCTION rpc_cancel_hanger_rental(uuid, uuid)
  SECURITY DEFINER
  SET search_path = public, extensions;

