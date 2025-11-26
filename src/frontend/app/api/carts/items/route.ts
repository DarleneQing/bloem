import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addToCartSchema } from "@/lib/validations/schemas";

// ============================================================================
// CART ITEMS API
// ============================================================================

/**
 * POST /api/carts/items
 * Add item to cart (creates cart if needed)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = addToCartSchema.safeParse(body);

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

    const { itemId } = validation.data;

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

    // Check if item exists and is available
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("id, owner_id, status, selling_price, title, market_id")
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

    // Can't add own items to cart
    if (item.owner_id === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot add your own items to cart",
        },
        { status: 400 }
      );
    }

    // Can only add RACK items
    if (item.status !== "RACK") {
      let errorMessage = "This item is not available for purchase";
      
      if (item.status === "RESERVED") {
        errorMessage = "This item is currently reserved by another buyer";
      } else if (item.status === "SOLD") {
        errorMessage = "This item has been sold";
      } else if (item.status === "WARDROBE") {
        errorMessage = "This item is not listed for sale";
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 409 }
      );
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
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create cart",
          details: cartError?.message,
        },
        { status: 500 }
      );
    }

    // Calculate expiry time (15 minutes from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    // Insert cart_item (triggers will validate item status)
    const { data: cartItem, error: cartItemError } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cart.id,
        item_id: itemId,
        reserved_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        reservation_count: 1,
      })
      .select()
      .single();

    if (cartItemError) {
      // Handle unique constraint violation (item already in a cart)
      if (cartItemError.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "This item is already in a cart",
          },
          { status: 409 }
        );
      }

      // Handle trigger validation errors
      if (cartItemError.message?.includes("not available for reservation")) {
        return NextResponse.json(
          {
            success: false,
            error: "Item is not available for reservation",
          },
          { status: 409 }
        );
      }

      console.error("Cart item creation error:", cartItemError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to add item to cart",
          details: cartItemError.message,
        },
        { status: 500 }
      );
    }

    // Update item status to RESERVED
    const { error: updateError } = await supabase
      .from("items")
      .update({
        status: "RESERVED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .eq("status", "RACK"); // Only update if still RACK (prevent race condition)

    if (updateError) {
      // Rollback: delete cart item if item update failed
      await supabase.from("cart_items").delete().eq("id", cartItem.id);
      
      console.error("Item status update error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to reserve item",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        cartItem: {
          id: cartItem.id,
          cart_id: cartItem.cart_id,
          item_id: cartItem.item_id,
          expires_at: cartItem.expires_at,
        },
        expiresAt: expiresAt.toISOString(),
        message: "Item added to cart successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add to cart API error:", error);
    
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


