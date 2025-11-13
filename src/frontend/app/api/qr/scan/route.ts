import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateQRCodeFormat } from "@/lib/qr/generation";

/**
 * POST /api/qr/scan
 * Scan a QR code and return its information
 * Public endpoint - no authentication required
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "QR code is required",
        },
        { status: 400 }
      );
    }

    // Validate QR code format
    if (!validateQRCodeFormat(code)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR code format",
        },
        { status: 400 }
      );
    }

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
      .eq("code", code)
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
    const market = batch?.market || null;

    // If QR code is linked to an item, get item details
    let item = null;
    if (qrCode.item_id && qrCode.status === "LINKED") {
      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .select(`
          id,
          title,
          description,
          selling_price,
          image_urls,
          thumbnail_url,
          status,
          owner:profiles!items_owner_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq("id", qrCode.item_id)
        .single();

      if (!itemError && itemData) {
        item = {
          id: itemData.id,
          title: itemData.title,
          description: itemData.description,
          selling_price: itemData.selling_price,
          image_urls: itemData.image_urls,
          thumbnail_url: itemData.thumbnail_url,
          status: itemData.status,
          owner: itemData.owner,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        qrCode: {
          id: qrCode.id,
          code: qrCode.code,
          status: qrCode.status,
          item_id: qrCode.item_id,
          linked_at: qrCode.linked_at,
          batch_id: qrCode.batch_id,
          prefix: qrCode.prefix,
          invalidated_at: qrCode.invalidated_at,
          invalidation_reason: qrCode.invalidation_reason,
          created_at: qrCode.created_at,
          updated_at: qrCode.updated_at,
        },
        market: market ? {
          id: market.id,
          name: market.name,
          status: market.status,
        } : null,
        item,
      },
    });
  } catch (error: any) {
    console.error("QR code scan error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to scan QR code",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

