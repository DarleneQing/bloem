"use server";

import { createClient } from "@/lib/supabase/server";
import type { Size } from "@/types/items";

/**
 * Get all sizes
 */
export async function getAllSizes(): Promise<Size[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("sizes")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching sizes:", error);
    return [];
  }

  return data || [];
}

/**
 * Get sizes by category
 * This function can be used to filter sizes based on item category
 * For example, shoes might only show EU sizes
 */
export async function getSizesByCategory(category?: string): Promise<Size[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from("sizes")
    .select("*");

  // Filter by size type based on category
  if (category === "SHOES") {
    query = query.eq("size_type", "eu_shoe");
  } else {
    // For clothing, show letter and numeric sizes
    query = query.in("size_type", ["letter", "numeric"]);
  }

  const { data, error } = await query.order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching sizes:", error);
    return [];
  }

  return data || [];
}

