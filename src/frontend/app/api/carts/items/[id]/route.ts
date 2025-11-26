import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ============================================================================
// CART ITEM MANAGEMENT API
// ============================================================================

/**
 * DELETE /api/carts/items/[id]
 * Remove item from cart (automatically returns item to RACK via trigger)
 */
export async function DELETE(
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

    // Verify cart_item belongs to user's cart
    const { data: cartItem, error: fetchError } = await supabase
      .from("cart_items")
      .select(`
        id,
        cart_id,
        item_id,
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
          error: "Not authorized to remove this item",
        },
        { status: 403 }
      );
    }

    // Delete cart_item (trigger will automatically return item to RACK)
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (deleteError) {
      console.error("Cart item deletion error:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to remove item from cart",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Item removed from cart successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove from cart API error:", error);
    
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


