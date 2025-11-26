import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { MAX_RESERVATION_EXTENSIONS, RESERVATION_DURATION_MS } from "@/types/carts";

// ============================================================================
// CART ITEM RESERVATION EXTENSION API
// ============================================================================

/**
 * POST /api/carts/items/[id]/extend
 * Extend reservation time by 15 minutes (max 2 extensions)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cartItemId = params.id;

    // Validate UUID format
    const uuidSchema = z.string().uuid("Invalid cart item ID format");
    const validation = uuidSchema.safeParse(cartItemId);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cart item ID format",
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    // Get cart_item with current reservation details
    const { data: cartItem, error: fetchError } = await supabase
      .from("cart_items")
      .select(`
        id,
        cart_id,
        item_id,
        reservation_count,
        expires_at,
        carts!inner(user_id)
      `)
      .eq("id", cartItemId)
      .single();

    if (fetchError || !cartItem) {
      if (fetchError?.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Cart item not found",
          },
          { status: 404 }
        );
      }

      console.error("Cart item fetch error:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch cart item",
          details: fetchError?.message,
        },
        { status: 500 }
      );
    }

    // Check ownership
    const cart = cartItem.carts as unknown as { user_id: string };
    if (cart.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authorized to extend this reservation",
        },
        { status: 403 }
      );
    }

    // Check if already expired
    const now = new Date();
    const expiresAt = new Date(cartItem.expires_at);
    
    if (expiresAt <= now) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot extend expired reservation",
        },
        { status: 410 } // 410 Gone
      );
    }

    // Check if max extensions reached
    if (cartItem.reservation_count >= MAX_RESERVATION_EXTENSIONS + 1) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum extensions reached (${MAX_RESERVATION_EXTENSIONS} extensions allowed)`,
          maxExtensions: MAX_RESERVATION_EXTENSIONS,
          currentCount: cartItem.reservation_count,
        },
        { status: 400 }
      );
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
      .eq("id", cartItemId);

    if (updateError) {
      console.error("Reservation extension error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to extend reservation",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        newExpiresAt: newExpiresAt.toISOString(),
        reservationCount: cartItem.reservation_count + 1,
        remainingExtensions: MAX_RESERVATION_EXTENSIONS - cartItem.reservation_count,
        message: "Reservation extended by 15 minutes",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Extend reservation API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


