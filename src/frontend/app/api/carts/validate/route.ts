import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// CART VALIDATION API
// ============================================================================

/**
 * POST /api/carts/validate
 * Validate all cart items before checkout
 * Checks if items are still reserved, not expired, and still exist
 */
export async function POST(_request: NextRequest) {
  try {
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

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (cartError || !cart) {
      return NextResponse.json(
        {
          success: true,
          valid: true,
          invalidItems: [],
          expiredItems: [],
          message: "No cart found",
        },
        { status: 200 }
      );
    }

    // Get all cart items with item details
    const { data: cartItems, error: itemsError } = await supabase
      .from("cart_items")
      .select(`
        id,
        item_id,
        expires_at,
        items!inner(
          id,
          title,
          status
        )
      `)
      .eq("cart_id", cart.id);

    if (itemsError) {
      console.error("Cart items fetch error:", itemsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch cart items",
          details: itemsError.message,
        },
        { status: 500 }
      );
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        {
          success: true,
          valid: true,
          invalidItems: [],
          expiredItems: [],
          message: "Cart is empty",
        },
        { status: 200 }
      );
    }

    // Validate each cart item
    const now = new Date();
    const invalidItems: Array<{ id: string; title: string; reason: string }> = [];
    const expiredItems: Array<{ id: string; title: string; expiresAt: string }> = [];

    for (const cartItem of cartItems) {
      const item = cartItem.items as any;
      const expiresAt = new Date(cartItem.expires_at);

      // Check if expired
      if (expiresAt <= now) {
        expiredItems.push({
          id: cartItem.item_id,
          title: item.title,
          expiresAt: cartItem.expires_at,
        });
        continue;
      }

      // Check if item still exists and is RESERVED
      if (!item || item.status !== "RESERVED") {
        invalidItems.push({
          id: cartItem.item_id,
          title: item?.title || "Unknown item",
          reason: !item ? "Item no longer exists" : `Item status changed to ${item.status}`,
        });
      }
    }

    const isValid = invalidItems.length === 0 && expiredItems.length === 0;

    // Return validation result
    return NextResponse.json(
      {
        success: true,
        valid: isValid,
        invalidItems,
        expiredItems,
        totalItems: cartItems.length,
        validItems: cartItems.length - invalidItems.length - expiredItems.length,
        message: isValid
          ? "All cart items are valid"
          : "Some cart items are invalid or expired",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Validate cart API error:", error);
    
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

