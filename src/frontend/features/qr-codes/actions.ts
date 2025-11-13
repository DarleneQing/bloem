"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSellerServer } from "@/lib/auth/utils";
import { qrCodeLinkingSchema } from "./validations";
import type { QRCodeLinkingInput } from "@/types/qr-codes";

/**
 * Link QR code to item
 * Requires:
 * - User is active seller
 * - User is enrolled in the market associated with QR code batch
 * - QR code is UNUSED
 * - Item is in WARDROBE status and belongs to user
 * - Item will be updated to RACK status and assigned to market
 */
export async function linkQRCodeToItem(input: QRCodeLinkingInput) {
  try {
    const validated = qrCodeLinkingSchema.parse(input);
    const sellerProfile = await requireActiveSellerServer();
    const supabase = await createClient();

    // Get QR code with batch and market info
    const { data: qrCode, error: qrError } = await supabase
      .from("qr_codes")
      .select(`
        *,
        qr_batches!inner(
          id,
          market_id,
          market:markets(
            id,
            name,
            status
          )
        )
      `)
      .eq("id", validated.qrCodeId)
      .single();

    if (qrError || !qrCode) {
      return { error: "QR code not found" } as const;
    }

    const batch = qrCode.qr_batches as any;
    const marketId = batch.market_id;

    if (!marketId) {
      return { error: "QR code batch is not associated with a market" } as const;
    }

    // Verify seller is enrolled in the market
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("market_enrollments")
      .select("id")
      .eq("market_id", marketId)
      .eq("seller_id", sellerProfile.id)
      .single();

    if (enrollmentError || !enrollment) {
      return { error: "You are not registered for this market" } as const;
    }

    // Verify seller has a hanger rental for this market (PENDING or CONFIRMED for testing)
    const { data: hangerRental, error: rentalError } = await supabase
      .from("hanger_rentals")
      .select("id, hanger_count, status")
      .eq("market_id", marketId)
      .eq("seller_id", sellerProfile.id)
      .in("status", ["PENDING", "CONFIRMED"])
      .single();

    if (rentalError || !hangerRental) {
      return { error: "You must rent hangers for this market before linking items" } as const;
    }

    // Count how many items the seller has already linked for this market
    const { count: linkedItemsCount, error: countError } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("market_id", marketId)
      .eq("owner_id", sellerProfile.id)
      .eq("status", "RACK");

    if (countError) {
      return { error: "Failed to check linked items count" } as const;
    }

    // Verify seller hasn't exceeded their hanger rental limit
    if ((linkedItemsCount || 0) >= hangerRental.hanger_count) {
      return {
        error: `You have reached your hanger limit. You have rented ${hangerRental.hanger_count} hanger(s) and have already linked ${linkedItemsCount} item(s).`,
      } as const;
    }

    // Verify QR code is UNUSED
    if (qrCode.status !== "UNUSED") {
      return { error: `QR code is already ${qrCode.status.toLowerCase()}` } as const;
    }

    if (qrCode.invalidated_at) {
      return { error: "QR code has been invalidated" } as const;
    }

    // Verify item exists and belongs to user
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id, owner_id, status, title")
      .eq("id", validated.itemId)
      .single();

    if (itemError || !item) {
      return { error: "Item not found" } as const;
    }

    if (item.owner_id !== sellerProfile.id) {
      return { error: "You do not own this item" } as const;
    }

    if (item.status !== "WARDROBE") {
      return { error: "Item must be in WARDROBE status to link QR code" } as const;
    }

    // Check if item already has a linked QR code
    const { data: existingLink } = await supabase
      .from("qr_codes")
      .select("id, code")
      .eq("item_id", validated.itemId)
      .eq("status", "LINKED")
      .single();

    if (existingLink) {
      return { error: `Item is already linked to QR code ${existingLink.code}` } as const;
    }

    // Perform the linking transaction
    const now = new Date().toISOString();

    // Update QR code
    const { data: updatedQRCode, error: updateQRError } = await supabase
      .from("qr_codes")
      .update({
        status: "LINKED",
        item_id: validated.itemId,
        linked_at: now,
        updated_at: now,
      })
      .eq("id", validated.qrCodeId)
      .select()
      .single();

    if (updateQRError || !updatedQRCode) {
      return { error: updateQRError?.message || "Failed to link QR code" } as const;
    }

    // Update item: set status to RACK and assign to market
    const { data: updatedItem, error: updateItemError } = await supabase
      .from("items")
      .update({
        status: "RACK",
        market_id: marketId,
        listed_at: now,
        updated_at: now,
      })
      .eq("id", validated.itemId)
      .select("id, title, status, market_id")
      .single();

    if (updateItemError || !updatedItem) {
      // Rollback QR code update
      await supabase
        .from("qr_codes")
        .update({
          status: "UNUSED",
          item_id: null,
          linked_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.qrCodeId);

      return { error: updateItemError?.message || "Failed to update item" } as const;
    }

    revalidatePath("/qr/link");
    revalidatePath("/wardrobe");

    return {
      data: {
        qrCode: updatedQRCode,
        item: updatedItem,
      },
    } as const;
  } catch (error: any) {
    if (error.message === "Authentication required" || error.message === "Active seller status required") {
      return { error: error.message } as const;
    }
    return { error: error.message || "Failed to link QR code" } as const;
  }
}

