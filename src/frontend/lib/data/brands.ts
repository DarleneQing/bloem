"use server";

import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/types/items";

/**
 * Get all brands
 */
export async function getAllBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching brands:", error);
    return [];
  }

  return data || [];
}

/**
 * Create a new brand
 */
export async function createBrand(name: string): Promise<{ success: true; brand: Brand } | { success: false; error: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("brands")
    .insert({ name, created_by_user: user.id })
    .select()
    .single();

  if (error) {
    console.error("Error creating brand:", error);
    return { success: false, error: error.message };
  }

  return { success: true, brand: data };
}

