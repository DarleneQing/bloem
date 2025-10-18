"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  itemUploadSchema,
  itemUpdateSchema,
  moveToRackSchema,
  privacyToggleSchema,
} from "./validations";
import type { ItemUploadInput, ItemUpdateInput, MoveToRackInput } from "./validations";

// Upload new item (all authenticated users)
export async function uploadItem(data: ItemUploadInput, imageUrls: string[], thumbnailUrl: string) {
  const validated = itemUploadSchema.parse(data);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Determine initial status
  let initialStatus = "WARDROBE";
  let sellingPrice = null;

  // Check if user is active seller and wants to set it to RACK
  if (validated.readyToSell && validated.sellingPrice) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("iban_verified_at")
      .eq("id", user.id)
      .single();

    if (profile?.iban_verified_at) {
      initialStatus = "RACK";
      sellingPrice = validated.sellingPrice;
    }
  }

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      owner_id: user.id,
      title: validated.title,
      description: validated.description,
      brand: validated.brand || null,
      category: validated.category,
      size: validated.size || null,
      condition: validated.condition,
      color: validated.color || null,
      selling_price: sellingPrice,
      status: initialStatus,
      image_urls: imageUrls,
      thumbnail_url: thumbnailUrl,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wardrobe");
  return { success: true, item };
}

// Update item details (owner only)
export async function updateItem(itemId: string, data: ItemUpdateInput) {
  const validated = itemUpdateSchema.parse(data);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership
  const { data: existingItem } = await supabase
    .from("items")
    .select("owner_id, status")
    .eq("id", itemId)
    .single();

  if (!existingItem || existingItem.owner_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Cannot update if SOLD
  if (existingItem.status === "SOLD") {
    return { error: "Cannot update items that are sold" };
  }

  const { error } = await supabase
    .from("items")
    .update({
      title: validated.title,
      description: validated.description,
      brand: validated.brand,
      category: validated.category,
      size: validated.size,
      condition: validated.condition,
      color: validated.color,
    })
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wardrobe");
  revalidatePath(`/wardrobe/${itemId}`);
  return { success: true };
}

// Delete item (owner only, not if LISTED/SOLD)
export async function deleteItem(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership and check status
  const { data: item } = await supabase
    .from("items")
    .select("owner_id, status, image_urls")
    .eq("id", itemId)
    .single();

  if (!item || item.owner_id !== user.id) {
    return { error: "Not authorized" };
  }

  if (item.status === "SOLD") {
    return { error: "Cannot delete items that are sold" };
  }

  // Delete the item
  const { error } = await supabase.from("items").delete().eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  // Note: Image cleanup from storage would be handled separately
  // TODO: Implement image cleanup job

  revalidatePath("/wardrobe");
  return { success: true };
}

// Toggle item privacy (PUBLIC ⟷ PRIVATE)
export async function toggleItemPrivacy(itemId: string) {
  const validated = privacyToggleSchema.parse({ itemId });
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get current item status
  const { data: item } = await supabase
    .from("items")
    .select("owner_id, status")
    .eq("id", validated.itemId)
    .single();

  if (!item || item.owner_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Privacy toggle is not applicable - privacy is managed at wardrobe level
  return { error: "Privacy is managed at wardrobe level, not per item" };
}

// Move item to RACK (seller-only)
export async function moveItemToRack(data: MoveToRackInput) {
  const validated = moveToRackSchema.parse(data);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify user is active seller
  const { data: profile } = await supabase
    .from("profiles")
    .select("iban_verified_at")
    .eq("id", user.id)
    .single();

  if (!profile?.iban_verified_at) {
    return { error: "You must be an active seller to prepare items for sale" };
  }

  // Verify ownership and check current status
  const { data: item } = await supabase
    .from("items")
    .select("owner_id, status")
    .eq("id", validated.itemId)
    .single();

  if (!item || item.owner_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Can only move to RACK from WARDROBE status
  if (item.status !== "WARDROBE") {
    return { error: "Can only move wardrobe items to rack" };
  }

  const { error } = await supabase
    .from("items")
    .update({
      status: "RACK",
      selling_price: validated.sellingPrice,
    })
    .eq("id", validated.itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wardrobe");
  revalidatePath(`/wardrobe/${validated.itemId}`);
  return { success: true };
}

// Remove item from RACK (seller-only)
export async function removeFromRack(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership and check current status
  const { data: item } = await supabase
    .from("items")
    .select("owner_id, status")
    .eq("id", itemId)
    .single();

  if (!item || item.owner_id !== user.id) {
    return { error: "Not authorized" };
  }

  if (item.status !== "RACK") {
    return { error: "Item is not in rack" };
  }

  const { error } = await supabase
    .from("items")
    .update({
      status: "WARDROBE",
      selling_price: null,
    })
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wardrobe");
  revalidatePath(`/wardrobe/${itemId}`);
  return { success: true };
}

