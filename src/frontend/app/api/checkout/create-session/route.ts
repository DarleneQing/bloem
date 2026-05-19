import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import {
  buildCartCheckoutIdempotencyKey,
  buildCartCheckoutLineItems,
  computeCartCheckoutTotalFromItems,
} from "@/lib/stripe/cart-checkout-session";
import { chfToStripeCents } from "@/lib/stripe/fees";
import { getAppUrl, getStripe } from "@/lib/stripe/server";
import type Stripe from "stripe";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rl = await checkRateLimit("cart_checkout", user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait a moment." },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id, updated_at")
      .eq("user_id", user.id)
      .single();

    if (cartError || !cart) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const { data: cartItems, error: itemsError } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        item_id,
        expires_at,
        items!inner(
          id,
          title,
          selling_price,
          status,
          owner_id
        )
      `
      )
      .eq("cart_id", cart.id)
      .gt("expires_at", new Date().toISOString());

    if (itemsError || !cartItems?.length) {
      return NextResponse.json({ error: "Cart is empty or expired" }, { status: 400 });
    }

    const now = new Date();
    const lineItemInputs: {
      itemId: string;
      title: string;
      sellingPrice: number;
    }[] = [];

    for (const row of cartItems) {
      const item = row.items as unknown as {
        title: string;
        selling_price: number | null;
        status: string;
      };
      if (new Date(row.expires_at) <= now) {
        return NextResponse.json({ error: "Some reservations expired" }, { status: 400 });
      }
      if (item.status !== "RESERVED") {
        return NextResponse.json(
          { error: "Some items are no longer available" },
          { status: 400 }
        );
      }
      lineItemInputs.push({
        itemId: row.item_id,
        title: item.title,
        sellingPrice: Number(item.selling_price ?? 0),
      });
    }

    const totalChf = computeCartCheckoutTotalFromItems(lineItemInputs);
    const amountCents = chfToStripeCents(totalChf);

    if (amountCents < 50) {
      return NextResponse.json({ error: "Order total is too low" }, { status: 400 });
    }

    const itemIds = lineItemInputs.map((row) => row.itemId).join(",");
    const appUrl = getAppUrl();

    const sessionParams = {
      mode: "payment",
      ui_mode: "elements",
      currency: "chf",
      customer_email: user.email ?? undefined,
      line_items: buildCartCheckoutLineItems(lineItemInputs),
      metadata: {
        kind: "cart_checkout",
        cart_id: cart.id,
        buyer_id: user.id,
        item_ids: itemIds,
      },
      return_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    } as unknown as Stripe.Checkout.SessionCreateParams;

    const session = await getStripe().checkout.sessions.create(sessionParams, {
      idempotencyKey: buildCartCheckoutIdempotencyKey(
        cart.id,
        cart.updated_at,
        amountCents,
        itemIds
      ),
    });

    if (!session.client_secret) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json(
      {
        clientSecret: session.client_secret,
        sessionId: session.id,
        amount: totalChf,
      },
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error("Create checkout session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
