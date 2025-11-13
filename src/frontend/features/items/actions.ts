"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  itemCreationSchema,
  itemUpdateSchema,
  moveToRackSchema,
  privacyToggleSchema,
} from "@/lib/validations/schemas";
import type { ItemCreationInput, ItemUpdateInput, MoveToRackInput } from "@/lib/validations/schemas";

// Upload new item (all authenticated users)
export async function uploadItem(data: ItemCreationInput, imageUrls: string[], thumbnailUrl: string) {
  const validated = itemCreationSchema.parse(data);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      owner_id: user.id,
      title: validated.title,
      description: validated.description && validated.description.trim() !== "" ? validated.description : null,
      brand_id: validated.brand_id || null,
      category: validated.category,
      subcategory_id: validated.subcategory_id || null,
      size_id: validated.size_id || null,
      condition: validated.condition,
      color_id: validated.color_id || null,
      gender: validated.gender,
      purchase_price: validated.purchasePrice || null,
      selling_price: validated.sellingPrice || null,
      status: "WARDROBE",
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
      description: validated.description && validated.description.trim() !== "" ? validated.description : null,
      brand_id: validated.brand_id,
      category: validated.category,
      subcategory_id: validated.subcategory_id,
      size_id: validated.size_id,
      condition: validated.condition,
      color_id: validated.color_id,
      gender: validated.gender,
      purchase_price: validated.purchasePrice !== undefined ? validated.purchasePrice : null,
      selling_price: validated.sellingPrice !== undefined ? validated.sellingPrice : null,
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

// Unlink item from QR code and remove from RACK
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

  // Find the QR code linked to this item
  const { data: linkedQRCode } = await supabase
    .from("qr_codes")
    .select("id, code, status")
    .eq("item_id", itemId)
    .eq("status", "LINKED")
    .maybeSingle();

  // Unlink QR code if it exists
  if (linkedQRCode) {
    const { error: unlinkError } = await supabase
      .from("qr_codes")
      .update({
        status: "UNUSED",
        item_id: null,
        linked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", linkedQRCode.id);

    if (unlinkError) {
      return { error: `Failed to unlink QR code: ${unlinkError.message}` };
    }
  }

  // Update item: change status from RACK to WARDROBE
  const { error } = await supabase
    .from("items")
    .update({
      status: "WARDROBE",
      market_id: null,
      listed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wardrobe");
  revalidatePath(`/wardrobe/${itemId}`);
  return { success: true };
}

