"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  itemCreationSchema,
  itemUpdateSchema,
  moveToRackSchema,
  privacyToggleSchema,
  addToCartSchema,
  removeFromCartSchema,
  extendReservationSchema,
} from "@/lib/validations/schemas";
import type { ItemCreationInput, ItemUpdateInput, MoveToRackInput } from "@/lib/validations/schemas";
import { MAX_RESERVATION_EXTENSIONS, RESERVATION_DURATION_MS } from "@/types/carts";

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

// ============================================================================
// CART MANAGEMENT ACTIONS
// ============================================================================

/**
 * Add item to cart
 * Creates cart if needed, reserves item for 15 minutes
 */
export async function addToCart(itemId: string) {
  try {
    const validated = addToCartSchema.parse({ itemId });
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Check if item exists and is available
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id, owner_id, status, selling_price, title")
      .eq("id", validated.itemId)
      .single();

    if (itemError || !item) {
      return { error: "Item not found" };
    }

    // Can't add own items to cart
    if (item.owner_id === user.id) {
      return { error: "You cannot add your own items to cart" };
    }

    // Can only add RACK items
    if (item.status !== "RACK") {
      if (item.status === "RESERVED") {
        return { error: "This item is currently reserved by another buyer" };
      }
      if (item.status === "SOLD") {
        return { error: "This item has been sold" };
      }
      return { error: "This item is not available for purchase" };
    }

    // Get or create user's cart
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .upsert(
        {
          user_id: user.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (cartError || !cart) {
      console.error("Cart creation error:", cartError);
      return { error: "Failed to create cart" };
    }

    // Calculate expiry time (15 minutes from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESERVATION_DURATION_MS);

    // Use a transaction-like approach: try to insert cart_item and update item atomically
    // The database triggers will validate the item status
    const { data: cartItem, error: cartItemError } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cart.id,
        item_id: validated.itemId,
        reserved_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        reservation_count: 1,
      })
      .select()
      .single();

    if (cartItemError) {
      // Handle unique constraint violation (item already in a cart)
      if (cartItemError.code === "23505") {
        return { error: "This item is already in a cart" };
      }
      console.error("Cart item creation error:", cartItemError);
      return { error: cartItemError.message || "Failed to add item to cart" };
    }

    // Update item status to RESERVED
    const { error: updateError } = await supabase
      .from("items")
      .update({
        status: "RESERVED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.itemId)
      .eq("status", "RACK"); // Only update if still RACK (prevent race condition)

    if (updateError) {
      // Rollback: delete cart item if item update failed
      await supabase.from("cart_items").delete().eq("id", cartItem.id);
      console.error("Item status update error:", updateError);
      return { error: "Failed to reserve item" };
    }

    revalidatePath("/cart");
    revalidatePath(`/items/${validated.itemId}`);
    
    return {
      success: true,
      cartItem,
      expiresAt: expiresAt.toISOString(),
      message: "Item added to cart",
    };
  } catch (error) {
    console.error("Add to cart error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to add item to cart" };
  }
}

/**
 * Remove item from cart
 * Automatically returns item to RACK status via database trigger
 */
export async function removeFromCart(cartItemId: string) {
  try {
    const validated = removeFromCartSchema.parse({ cartItemId });
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Verify cart_item belongs to user's cart
    const { data: cartItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("id, cart_id, carts!inner(user_id)")
      .eq("id", validated.cartItemId)
      .single();

    if (fetchError || !cartItem) {
      return { error: "Cart item not found" };
    }

    const cart = cartItem.carts as unknown as { user_id: string };
    if (cart.user_id !== user.id) {
      return { error: "Not authorized to remove this item" };
    }

    // Delete cart_item (trigger will return item to RACK)
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", validated.cartItemId);

    if (deleteError) {
      console.error("Cart item deletion error:", deleteError);
      return { error: "Failed to remove item from cart" };
    }

    revalidatePath("/cart");
    
    return {
      success: true,
      message: "Item removed from cart",
    };
  } catch (error) {
    console.error("Remove from cart error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to remove item from cart" };
  }
}

/**
 * Extend reservation time by 15 minutes
 * Maximum 2 extensions allowed (45 minutes total)
 */
export async function extendReservation(cartItemId: string) {
  try {
    const validated = extendReservationSchema.parse({ cartItemId });
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Get cart_item with current reservation details
    const { data: cartItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("id, cart_id, reservation_count, expires_at, carts!inner(user_id)")
      .eq("id", validated.cartItemId)
      .single();

    if (fetchError || !cartItem) {
      return { error: "Cart item not found" };
    }

    const cart = cartItem.carts as unknown as { user_id: string };
    if (cart.user_id !== user.id) {
      return { error: "Not authorized to extend this reservation" };
    }

    // Check if already expired
    const now = new Date();
    const expiresAt = new Date(cartItem.expires_at);
    if (expiresAt <= now) {
      return { error: "Cannot extend expired reservation" };
    }

    // Check if max extensions reached
    if (cartItem.reservation_count >= MAX_RESERVATION_EXTENSIONS + 1) {
      return {
        error: `Maximum extensions reached (${MAX_RESERVATION_EXTENSIONS} extensions allowed)`,
      };
    }

    // Calculate new expiry time (add 15 minutes to current expiry)
    const newExpiresAt = new Date(expiresAt.getTime() + RESERVATION_DURATION_MS);

    // Update cart_item
    const { error: updateError } = await supabase
      .from("cart_items")
      .update({
        expires_at: newExpiresAt.toISOString(),
        reservation_count: cartItem.reservation_count + 1,
        last_extended_at: now.toISOString(),
      })
      .eq("id", validated.cartItemId);

    if (updateError) {
      console.error("Reservation extension error:", updateError);
      return { error: "Failed to extend reservation" };
    }

    revalidatePath("/cart");
    
    return {
      success: true,
      newExpiresAt: newExpiresAt.toISOString(),
      reservationCount: cartItem.reservation_count + 1,
      message: "Reservation extended by 15 minutes",
    };
  } catch (error) {
    console.error("Extend reservation error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to extend reservation" };
  }
}

/**
 * Clear expired cart items (for cron job)
 * Returns items to RACK status
 */
export async function clearExpiredCartItems() {
  try {
    const supabase = await createClient();

    // Find all expired cart items
    const { data: expiredItems, error: fetchError } = await supabase
      .from("cart_items")
      .select("id, item_id")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) {
      console.error("Fetch expired items error:", fetchError);
      return { error: "Failed to fetch expired items" };
    }

    if (!expiredItems || expiredItems.length === 0) {
      return { success: true, clearedCount: 0 };
    }

    // Delete expired cart items (triggers will return items to RACK)
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (deleteError) {
      console.error("Delete expired items error:", deleteError);
      return { error: "Failed to clear expired items" };
    }

    console.log(`Cleared ${expiredItems.length} expired cart items`);
    
    return {
      success: true,
      clearedCount: expiredItems.length,
    };
  } catch (error) {
    console.error("Clear expired cart items error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to clear expired cart items" };
  }
}

