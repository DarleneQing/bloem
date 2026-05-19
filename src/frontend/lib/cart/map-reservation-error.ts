/** Minimal PostgREST error shape from Supabase RPC calls. */
export interface ReservationRpcError {
  message?: string;
  code?: string;
}

/** Map rpc_reserve_cart_item errors to user-facing messages. */
export function mapReservationRpcError(error: ReservationRpcError): string {
  const message = error.message ?? "";

  if (message.includes("not_authenticated")) {
    return "Not authenticated";
  }

  if (message.includes("item_not_found")) {
    return "Item not found";
  }

  if (message.includes("cannot_reserve_own_item")) {
    return "You cannot add your own items to cart";
  }

  if (message.includes("item_not_available")) {
    const statusMatch = message.match(/item_not_available:(\w+)/);
    const status = statusMatch?.[1];
    if (status === "RESERVED") {
      return "This item is currently reserved by another buyer";
    }
    if (status === "SOLD") {
      return "This item has been sold";
    }
    if (status === "WARDROBE") {
      return "This item is not listed for sale";
    }
    return "This item is not available for purchase";
  }

  if (error.code === "23505") {
    return "This item is already in a cart";
  }

  return "Failed to reserve item";
}
