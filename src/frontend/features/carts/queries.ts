"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { CartSummary, EnrichedCartItem } from "@/types/carts";
import {
  calculateTimeRemaining,
  getCartItemStatus,
  canExtendReservation,
  calculateCartTotal,
  hasExpiringItems,
  hasExpiredItems,
} from "@/lib/utils/cart";

// Shared projection for the joined item row inside a cart_items query.
// Kept in one place so getUserCart and getExpiringCartItems stay in sync.
const CART_ITEM_WITH_ITEM_SELECT = `
  id,
  cart_id,
  item_id,
  reserved_at,
  expires_at,
  reservation_count,
  last_extended_at,
  auto_removed,
  created_at,
  items!inner(
    id,
    owner_id,
    title,
    description,
    brand_id,
    category,
    size_id,
    condition,
    color_id,
    subcategory_id,
    gender,
    purchase_price,
    selling_price,
    status,
    image_urls,
    thumbnail_url,
    market_id,
    listed_at,
    sold_at,
    buyer_id,
    created_at,
    updated_at,
    brands(id, name),
    sizes(id, name),
    colors(id, name, hex_code),
    profiles!items_owner_id_fkey(id, first_name, last_name, email)
  )
` as const;

// Supabase's generated types for the joined cart_items query don't perfectly
// match our app-side EnrichedCartItem shape (brands→brand rename, etc.). The
// double cast here mirrors what the original implementation in
// features/items/queries.ts did with `as any` — a follow-up should regenerate
// Supabase types and remove this.
interface CartItemRow {
  id: string;
  cart_id: string;
  item_id: string;
  reserved_at: string;
  expires_at: string;
  reservation_count: number;
  last_extended_at: string | null;
  auto_removed: boolean;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any;
}

function enrichCartItem(row: CartItemRow): EnrichedCartItem {
  const item = row.items;
  const time_remaining_ms = calculateTimeRemaining(row.expires_at);
  const status = getCartItemStatus(row.expires_at);
  const can_extend = canExtendReservation(row.reservation_count, row.expires_at);

  return {
    ...row,
    item: {
      ...item,
      brand: item.brands,
      size: item.sizes,
      color: item.colors,
      owner: item.profiles,
    },
    status,
    time_remaining_ms,
    can_extend,
  } as unknown as EnrichedCartItem;
}

/**
 * Get the caller's cart with all live items and computed fields.
 */
export async function getUserCart(): Promise<CartSummary | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id, user_id, created_at, updated_at")
    .eq("user_id", user.id)
    .single();

  if (cartError || !cart) {
    return null;
  }

  const { data: cartItems, error: itemsError } = await supabase
    .from("cart_items")
    .select(CART_ITEM_WITH_ITEM_SELECT)
    .eq("cart_id", cart.id)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (itemsError) {
    logger.error("Cart items fetch error:", itemsError);
    return null;
  }

  if (!cartItems || cartItems.length === 0) {
    return {
      cart,
      items: [],
      total_items: 0,
      total_price: 0,
      has_expiring_items: false,
      has_expired_items: false,
    };
  }

  const enrichedItems = (cartItems as unknown as CartItemRow[]).map(enrichCartItem);

  return {
    cart,
    items: enrichedItems,
    total_items: enrichedItems.length,
    total_price: calculateCartTotal(enrichedItems),
    has_expiring_items: hasExpiringItems(enrichedItems),
    has_expired_items: hasExpiredItems(enrichedItems),
  };
}

/**
 * Count of live items in the caller's cart (for the header badge).
 */
export async function getCartItemCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!cart) {
    return 0;
  }

  const { count, error } = await supabase
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("cart_id", cart.id)
    .gt("expires_at", new Date().toISOString());

  if (error) {
    logger.error("Cart count error:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Cart items that will expire in under 5 minutes — for surfacing urgency UI.
 */
export async function getExpiringCartItems(): Promise<EnrichedCartItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!cart) {
    return [];
  }

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  const { data: cartItems, error } = await supabase
    .from("cart_items")
    .select(CART_ITEM_WITH_ITEM_SELECT)
    .eq("cart_id", cart.id)
    .gt("expires_at", new Date().toISOString())
    .lt("expires_at", fiveMinutesFromNow.toISOString())
    .order("expires_at", { ascending: true });

  if (error || !cartItems) {
    return [];
  }

  return (cartItems as unknown as CartItemRow[]).map(enrichCartItem);
}
