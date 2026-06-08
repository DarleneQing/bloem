"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isActiveSellerProfile } from "@/lib/auth/utils";
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
import { mapReservationRpcError } from "@/lib/cart/map-reservation-error";
import {
  canExtendReservation,
  computeExtendedExpiresAt,
} from "@/lib/utils/cart";
import { MAX_RESERVATION_EXTENSIONS } from "@/types/carts";

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
      fit: validated.fit || null,
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
      fit: validated.fit ?? null,
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
    .select("stripe_payouts_enabled")
    .eq("id", user.id)
    .single();

  if (!profile || !isActiveSellerProfile(profile)) {
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

// Mark item as sold (owner, RACK items only)
export async function markItemAsSold(itemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const { data: item } = await supabase
    .from("items")
    .select("owner_id, status")
    .eq("id", itemId)
    .single();

  if (!item || item.owner_id !== user.id) {
    return { error: "Not authorized" } as const;
  }

  if (item.status !== "RACK") {
    return { error: "Only items ready for sale can be marked as sold" } as const;
  }

  const soldAt = new Date().toISOString();

  const { error: itemError } = await supabase
    .from("items")
    .update({
      status: "SOLD",
      sold_at: soldAt,
      updated_at: soldAt,
    })
    .eq("id", itemId);

  if (itemError) {
    return { error: itemError.message } as const;
  }

  await supabase
    .from("qr_codes")
    .update({
      status: "SOLD",
      updated_at: soldAt,
    })
    .eq("item_id", itemId)
    .eq("status", "LINKED");

  revalidatePath("/wardrobe");
  revalidatePath(`/wardrobe/${itemId}`);
  return { success: true } as const;
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

    const { data, error } = await supabase
      .rpc("rpc_reserve_cart_item", { p_item_id: validated.itemId })
      .single<{
        cart_item_id: string;
        cart_id: string;
        item_id: string;
        expires_at: string;
      }>();

    if (error) {
      console.error("Reservation RPC error:", error);
      return { error: mapReservationRpcError(error) };
    }

    if (!data) {
      return { error: "Failed to reserve item" };
    }

    const cartItem = {
      id: data.cart_item_id,
      cart_id: data.cart_id,
      item_id: data.item_id,
      expires_at: data.expires_at,
    };

    revalidatePath("/checkout");
    revalidatePath("/cart");
    revalidatePath(`/items/${validated.itemId}`);

    const { data: qrRow } = await supabase
      .from("qr_codes")
      .select("code")
      .eq("item_id", validated.itemId)
      .eq("status", "LINKED")
      .maybeSingle();

    if (qrRow?.code) {
      revalidatePath(`/qr/${qrRow.code}`);
    }

    return {
      success: true,
      cartItem,
      expiresAt: data.expires_at,
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
      .select("id, item_id, cart_id, carts!inner(user_id)")
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

    revalidatePath("/checkout");
    revalidatePath("/cart");
    revalidatePath(`/items/${cartItem.item_id}`);
    revalidatePath("/scan");

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
 * Extend reservation time by 15 minutes, capped at 1 hour from reserved_at.
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
      .select(
        "id, cart_id, reserved_at, reservation_count, expires_at, carts!inner(user_id)"
      )
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

    if (
      !canExtendReservation(
        cartItem.reservation_count,
        cartItem.expires_at,
        cartItem.reserved_at
      )
    ) {
      return {
        error: "Maximum reservation time reached (1 hour from when you reserved)",
      };
    }

    const newExpiresAt = computeExtendedExpiresAt(
      cartItem.reserved_at,
      cartItem.expires_at
    );

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

    revalidatePath("/checkout");
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

