"use server";

import { createClient } from "@/lib/supabase/server";
import type { Item, ItemStatus } from "@/types/items";

export interface ItemFilters {
  status?: ItemStatus;
  category?: string;
  search?: string;
  sortBy?: "newest" | "oldest" | "price_low" | "price_high";
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
    .select("*")
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
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`
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
    console.error("Error fetching items:", error);
    return null;
  }

  return items as Item[];
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
      )
    `
    )
    .eq("id", itemId)
    .single();

  if (error) {
    console.error("Error fetching item:", error);
    return null;
  }

  return item;
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
      )
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
    console.error("Error fetching public wardrobe:", error);
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
    .select("*")
    .eq("owner_id", user.id)
    .eq("status", "RACK")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching rack items:", error);
    return null;
  }

  return items as Item[];
}

