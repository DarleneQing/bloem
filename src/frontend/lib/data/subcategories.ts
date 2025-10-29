"use server";

import { createClient } from "@/lib/supabase/server";
import type { Subcategory, ItemCategory } from "@/types/items";

/**
 * Get all subcategories for a specific category
 */
export async function getSubcategoriesByCategory(category: ItemCategory): Promise<Subcategory[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("item_subcategories")
    .select("*")
    .eq("category", category)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching subcategories:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all subcategories
 */
export async function getAllSubcategories(): Promise<Subcategory[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("item_subcategories")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching subcategories:", error);
    return [];
  }

  return data || [];
}

