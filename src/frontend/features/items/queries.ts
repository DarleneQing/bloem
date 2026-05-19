"use server";

import { createClient } from "@/lib/supabase/server";
import type { Item, ItemStatus, Brand, Color, Size, Subcategory } from "@/types/items";

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

export async function getMyPurchasedItems() {
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
      subcategory:item_subcategories(*),
      owner:profiles!items_owner_id_fkey(
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("buyer_id", user.id)
    .eq("status", "SOLD")
    .order("sold_at", { ascending: false, nullsFirst: false });

  if (error) {
    return null;
  }

  return items as EnrichedItem[];
}

// Get QR code linked to an item (owner view)
export async function getLinkedQRCodeForItem(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: item } = await supabase
    .from("items")
    .select("owner_id")
    .eq("id", itemId)
    .single();

  if (!item || item.owner_id !== user.id) {
    return null;
  }

  const { data: qrCode } = await supabase
    .from("qr_codes")
    .select("id, code, status, linked_at")
    .eq("item_id", itemId)
    .eq("status", "LINKED")
    .maybeSingle();

  return qrCode;
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
        stripe_payouts_enabled
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
        stripe_payouts_enabled,
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

  return items as EnrichedItem[];
}

export interface PublicWardrobeStats {
  itemCount: number;
  soldCount: number | null;
}

export async function getPublicWardrobeStats(
  userId: string,
  isOwnProfile: boolean
): Promise<PublicWardrobeStats> {
  const supabase = await createClient();

  const { count: itemCount, error: itemError } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("status", "WARDROBE");

  if (itemError) {
    return { itemCount: 0, soldCount: null };
  }

  if (!isOwnProfile) {
    return { itemCount: itemCount ?? 0, soldCount: null };
  }

  const { count: soldCount, error: soldError } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("status", "SOLD");

  if (soldError) {
    return { itemCount: itemCount ?? 0, soldCount: null };
  }

  return { itemCount: itemCount ?? 0, soldCount: soldCount ?? 0 };
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

export interface DiscoverableRackItem {
  id: string;
  title: string;
  selling_price: number | null;
  thumbnail_url: string;
  category: Item["category"];
  gender: Item["gender"];
  qrCode: string;
}

export async function getDiscoverableRackItems(limit = 24) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: rows, error } = await supabase
    .from("items")
    .select(
      `
      id,
      title,
      selling_price,
      thumbnail_url,
      category,
      gender,
      qr_codes!inner(code),
      market:markets!inner(status)
    `
    )
    .eq("status", "RACK")
    .eq("market.status", "ACTIVE")
    .neq("owner_id", user.id)
    .order("listed_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !rows) {
    return [];
  }

  return rows
    .map((row) => {
      const codes = row.qr_codes as { code: string }[] | { code: string } | null;
      const code = Array.isArray(codes) ? codes[0]?.code : codes?.code;
      if (!code || !row.thumbnail_url) return null;

      return {
        id: row.id,
        title: row.title,
        selling_price: row.selling_price,
        thumbnail_url: row.thumbnail_url,
        category: row.category,
        gender: row.gender,
        qrCode: code,
      } satisfies DiscoverableRackItem;
    })
    .filter((entry): entry is DiscoverableRackItem => entry != null);
}
