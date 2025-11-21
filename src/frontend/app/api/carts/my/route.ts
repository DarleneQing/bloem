import { NextRequest, NextResponse } from "next/server";
import { getUserCart } from "@/features/items/queries";

// ============================================================================
// USER CART API
// ============================================================================

/**
 * GET /api/carts/my
 * Get current user's cart with all items and computed fields
 */
export async function GET(_request: NextRequest) {
  try {
    // Get user's cart using the query function
    const cartSummary = await getUserCart();

    if (!cartSummary) {
      return NextResponse.json(
        {
          success: true,
          cart: null,
          message: "No cart found",
        },
        { status: 200 }
      );
    }

    // Return cart summary
    return NextResponse.json(
      {
        success: true,
        cart: cartSummary,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get cart API error:", error);
    
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

