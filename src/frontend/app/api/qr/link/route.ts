import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSellerServer } from "@/lib/auth/utils";
import { qrCodeLinkingSchema } from "@/lib/validations/schemas";

/**
 * POST /api/qr/link
 * Link a QR code to an item
 * Requires active seller authentication
 */
export async function POST(request: NextRequest) {
  try {
    const sellerProfile = await requireActiveSellerServer();
    const body = await request.json();
    const validation = qrCodeLinkingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { qrCodeId, itemId } = validation.data;
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
      .eq("id", qrCodeId)
      .single();

    if (qrError || !qrCode) {
      return NextResponse.json(
        {
          success: false,
          error: "QR code not found",
        },
        { status: 404 }
      );
    }

    const batch = qrCode.qr_batches as any;
    const marketId = batch.market_id;

    if (!marketId) {
      return NextResponse.json(
        {
          success: false,
          error: "QR code batch is not associated with a market",
        },
        { status: 400 }
      );
    }

    // Verify seller is enrolled in the market
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("market_enrollments")
      .select("id")
      .eq("market_id", marketId)
      .eq("seller_id", sellerProfile.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not registered for this market",
        },
        { status: 403 }
      );
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
      return NextResponse.json(
        {
          success: false,
          error: "You must rent hangers for this market before linking items",
        },
        { status: 403 }
      );
    }

    // Count how many items the seller has already linked for this market
    const { count: linkedItemsCount, error: countError } = await supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("market_id", marketId)
      .eq("owner_id", sellerProfile.id)
      .eq("status", "RACK");

    if (countError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check linked items count",
        },
        { status: 500 }
      );
    }

    // Verify seller hasn't exceeded their hanger rental limit
    if ((linkedItemsCount || 0) >= hangerRental.hanger_count) {
      return NextResponse.json(
        {
          success: false,
          error: `You have reached your hanger limit. You have rented ${hangerRental.hanger_count} hanger(s) and have already linked ${linkedItemsCount} item(s).`,
        },
        { status: 400 }
      );
    }

    // Verify QR code is UNUSED
    if (qrCode.status !== "UNUSED") {
      return NextResponse.json(
        {
          success: false,
          error: `QR code is already ${qrCode.status.toLowerCase()}`,
        },
        { status: 400 }
      );
    }

    if (qrCode.invalidated_at) {
      return NextResponse.json(
        {
          success: false,
          error: "QR code has been invalidated",
        },
        { status: 400 }
      );
    }

    // Verify item exists and belongs to user
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id, owner_id, status, title")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        {
          success: false,
          error: "Item not found",
        },
        { status: 404 }
      );
    }

    if (item.owner_id !== sellerProfile.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not own this item",
        },
        { status: 403 }
      );
    }

    if (item.status !== "WARDROBE") {
      return NextResponse.json(
        {
          success: false,
          error: "Item must be in WARDROBE status to link QR code",
        },
        { status: 400 }
      );
    }

    // Check if item already has a linked QR code
    const { data: existingLink } = await supabase
      .from("qr_codes")
      .select("id, code")
      .eq("item_id", itemId)
      .eq("status", "LINKED")
      .single();

    if (existingLink) {
      return NextResponse.json(
        {
          success: false,
          error: `Item is already linked to QR code ${existingLink.code}`,
        },
        { status: 400 }
      );
    }

    // Perform the linking transaction
    const now = new Date().toISOString();

    // Update QR code
    const { data: updatedQRCode, error: updateQRError } = await supabase
      .from("qr_codes")
      .update({
        status: "LINKED",
        item_id: itemId,
        linked_at: now,
        updated_at: now,
      })
      .eq("id", qrCodeId)
      .select()
      .single();

    if (updateQRError || !updatedQRCode) {
      return NextResponse.json(
        {
          success: false,
          error: updateQRError?.message || "Failed to link QR code",
        },
        { status: 500 }
      );
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
      .eq("id", itemId)
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
        .eq("id", qrCodeId);

      return NextResponse.json(
        {
          success: false,
          error: updateItemError?.message || "Failed to update item",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        qrCode: updatedQRCode,
        item: updatedItem,
      },
    });
  } catch (error: any) {
    console.error("QR code linking error:", error);

    if (error.message === "Authentication required" || error.message === "Active seller status required") {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to link QR code",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

