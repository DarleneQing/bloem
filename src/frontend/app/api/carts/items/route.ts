import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addToCartSchema } from "@/lib/validations/schemas";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { mapReservationRpcError } from "@/lib/cart/map-reservation-error";
import { logger } from "@/lib/logger";

/**
 * POST /api/carts/items
 * Reserve an item for the caller. The actual cart upsert, cart_items insert,
 * and items.status flip happen atomically inside rpc_reserve_cart_item under
 * a row-level lock — see migration 029.
 *
 * Rate-limited at 5 reservations/min per authenticated user (cart_reserve preset).
 * Limit is keyed on the user id so a shared IP doesn't penalize a household.
 */
export async function POST(request: NextRequest) {
  try {
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
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const rl = await checkRateLimit("cart_reserve", user.id);
    if (!rl.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many reservations — please slow down and try again shortly.",
        },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { data, error } = await supabase
      .rpc("rpc_reserve_cart_item", { p_item_id: itemId })
      .single<{
        cart_item_id: string;
        cart_id: string;
        item_id: string;
        expires_at: string;
      }>();

    if (error) {
      return mapReservationErrorResponse(error);
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Failed to reserve item" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        cartItem: {
          id: data.cart_item_id,
          cart_id: data.cart_id,
          item_id: data.item_id,
          expires_at: data.expires_at,
        },
        expiresAt: data.expires_at,
        message: "Item added to cart successfully",
      },
      { status: 201, headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    logger.error("Add to cart API error:", error);
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

interface PostgrestError {
  message?: string;
  code?: string;
  details?: string | null;
}

function mapReservationErrorResponse(error: PostgrestError) {
  const message = error.message ?? "";
  const userMessage = mapReservationRpcError(error);

  if (message.includes("not_authenticated")) {
    return NextResponse.json({ success: false, error: userMessage }, { status: 401 });
  }

  if (message.includes("item_not_found")) {
    return NextResponse.json({ success: false, error: userMessage }, { status: 404 });
  }

  if (message.includes("cannot_reserve_own_item")) {
    return NextResponse.json({ success: false, error: userMessage }, { status: 400 });
  }

  if (message.includes("item_not_available") || error.code === "23505") {
    return NextResponse.json({ success: false, error: userMessage }, { status: 409 });
  }

  logger.error("Reservation RPC error:", error);
  return NextResponse.json(
    {
      success: false,
      error: userMessage,
      details: error.message,
    },
    { status: 500 }
  );
}
