"use server";

import { createClient } from "@/lib/supabase/server";
import type { Color } from "@/types/items";

/**
 * Get all colors
 */
export async function getAllColors(): Promise<Color[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("colors")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching colors:", error);
    return [];
  }

  return data || [];
}

/**
 * Create a new color
 */
export async function createColor(name: string, hexCode?: string): Promise<{ success: true; color: Color } | { success: false; error: string }> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("colors")
    .insert({ name, hex_code: hexCode })
    .select()
    .single();

  if (error) {
    console.error("Error creating color:", error);
    return { success: false, error: error.message };
  }

  return { success: true, color: data };
}

