"use server";

import { createClient } from "@/lib/supabase/server";
import type { Item, ItemStatus, Brand, Color, Size, Subcategory } from "@/types/items";
import type { CartSummary, EnrichedCartItem } from "@/types/carts";
import {
  calculateTimeRemaining,
  getCartItemStatus,
  canExtendReservation,
  calculateCartTotal,
  hasExpiringItems,
  hasExpiredItems,
} from "@/lib/utils/cart";

export interface ItemFilters {
  status?: ItemStatus;
  category?: string;
  search?: string;
  sortBy?: "newest" | "oldest" | "price_low" | "price_high";
}

export interface EnrichedItem extends Item {
  brand?: Brand | null;
  color?: Color | null;
  size?: Size | null;
  subcategory?: Subcategory | null;
}

// Get current user's items with optional filters
export async function getMyItems(filters?: ItemFilters) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let query = supabase
    .from("items")
    .select(`
      *,
      brand:brands(*),
      color:colors(*),
      size:sizes(*),
      subcategory:item_subcategories(*)
    `)
    .eq("owner_id", user.id);

  // Apply filters
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  // Apply sorting
  switch (filters?.sortBy) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "price_low":
      query = query.order("selling_price", { ascending: true, nullsFirst: false });
      break;
    case "price_high":
      query = query.order("selling_price", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: items, error } = await query;

  if (error) {
    return null;
  }

  return items as EnrichedItem[];
}

// Get items grouped by status for stats
export async function getMyItemsStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: items } = await supabase
    .from("items")
    .select("status")
    .eq("owner_id", user.id);

  if (!items) {
    return { total: 0, display: 0, forSale: 0, sold: 0 };
  }

  const stats = {
    total: items.length,
    display: items.filter(
      (item) => item.status === "WARDROBE"
    ).length,
    forSale: items.filter((item) => item.status === "RACK").length,
    sold: items.filter((item) => item.status === "SOLD").length,
  };

  return stats;
}

// Get single item by ID
export async function getItemById(itemId: string) {
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("items")
    .select(
      `
      *,
      owner:profiles!items_owner_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        iban_verified_at
      ),
      brand:brands(*),
      color:colors(*),
      size:sizes(*),
      subcategory:item_subcategories(*)
    `
    )
    .eq("id", itemId)
    .single();

  if (error) {
    return null;
  }

  return item as any;
}

// Get user's public wardrobe (for viewing other users)
export async function getPublicWardrobe(userId: string, filters?: { category?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("items")
    .select(
      `
      *,
      owner:profiles!items_owner_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url,
        iban_verified_at,
        created_at
      ),
      brand:brands(*),
      color:colors(*),
      size:sizes(*),
      subcategory:item_subcategories(*)
    `
    )
    .eq("owner_id", userId)
    .eq("status", "WARDROBE")
    .order("created_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  const { data: items, error } = await query;

  if (error) {
    return null;
  }

  return items;
}

// Get items in RACK (ready for selling)
export async function getItemsInRack() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: items, error } = await supabase
    .from("items")
    .select(`
      *,
      brand:brands(*),
      color:colors(*),
      size:sizes(*),
      subcategory:item_subcategories(*)
    `)
    .eq("owner_id", user.id)
    .eq("status", "RACK")
    .order("created_at", { ascending: false });

  if (error) {
    return null;
  }

  return items as EnrichedItem[];
}

// ============================================================================
// CART QUERIES
// ============================================================================

/**
 * Get user's cart with all items and computed fields
 */
export async function getUserCart(): Promise<CartSummary | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get cart with cart_items and full item details
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select(`
      id,
      user_id,
      created_at,
      updated_at
    `)
    .eq("user_id", user.id)
    .single();

  if (cartError || !cart) {
    // No cart exists yet
    return null;
  }

  // Get cart items with full item details
  const { data: cartItems, error: itemsError } = await supabase
    .from("cart_items")
    .select(`
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
    `)
    .eq("cart_id", cart.id)
    .gt("expires_at", new Date().toISOString()) // Only active items
    .order("created_at", { ascending: false });

  if (itemsError) {
    console.error("Cart items fetch error:", itemsError);
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

  // Enrich cart items with computed fields
  const enrichedItems: EnrichedCartItem[] = cartItems.map((cartItem) => {
    const item = cartItem.items as any;
    const timeRemaining = calculateTimeRemaining(cartItem.expires_at);
    const status = getCartItemStatus(cartItem.expires_at);
    const can_extend = canExtendReservation(
      cartItem.reservation_count,
      cartItem.expires_at
    );

    return {
      ...cartItem,
      item: {
        ...item,
        brand: item.brands,
        size: item.sizes,
        color: item.colors,
        owner: item.profiles,
      },
      status,
      time_remaining_ms: timeRemaining,
      can_extend,
    };
  });

  const totalPrice = calculateCartTotal(enrichedItems);
  const hasExpiring = hasExpiringItems(enrichedItems);
  const hasExpired = hasExpiredItems(enrichedItems);

  return {
    cart,
    items: enrichedItems,
    total_items: enrichedItems.length,
    total_price: totalPrice,
    has_expiring_items: hasExpiring,
    has_expired_items: hasExpired,
  };
}

/**
 * Get count of items in user's cart (for badge display)
 */
export async function getCartItemCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  // Get cart
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (cartError || !cart) {
    return 0;
  }

  // Count active cart items (not expired)
  const { count, error: countError } = await supabase
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("cart_id", cart.id)
    .gt("expires_at", new Date().toISOString());

  if (countError) {
    console.error("Cart count error:", countError);
    return 0;
  }

  return count || 0;
}

/**
 * Get cart items that are expiring soon (< 5 minutes)
 */
export async function getExpiringCartItems(): Promise<EnrichedCartItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get cart
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (cartError || !cart) {
    return [];
  }

  // Calculate 5 minutes from now
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

  // Get cart items expiring soon
  const { data: cartItems, error: itemsError } = await supabase
    .from("cart_items")
    .select(`
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
    `)
    .eq("cart_id", cart.id)
    .gt("expires_at", new Date().toISOString())
    .lt("expires_at", fiveMinutesFromNow.toISOString())
    .order("expires_at", { ascending: true });

  if (itemsError || !cartItems) {
    return [];
  }

  // Enrich cart items with computed fields
  const enrichedItems: EnrichedCartItem[] = cartItems.map((cartItem) => {
    const item = cartItem.items as any;
    const timeRemaining = calculateTimeRemaining(cartItem.expires_at);
    const status = getCartItemStatus(cartItem.expires_at);
    const can_extend = canExtendReservation(
      cartItem.reservation_count,
      cartItem.expires_at
    );

    return {
      ...cartItem,
      item: {
        ...item,
        brand: item.brands,
        size: item.sizes,
        color: item.colors,
        owner: item.profiles,
      },
      status,
      time_remaining_ms: timeRemaining,
      can_extend,
    };
  });

  return enrichedItems;
}

