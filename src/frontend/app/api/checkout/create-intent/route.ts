import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { chfToStripeCents, computeCartCheckoutTotal } from "@/lib/stripe/fees";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
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
    for (const row of cartItems) {
      const item = row.items as unknown as { status: string; selling_price: number | null };
      if (new Date(row.expires_at) <= now) {
        return NextResponse.json({ error: "Some reservations expired" }, { status: 400 });
      }
      if (item.status !== "RESERVED") {
        return NextResponse.json(
          { error: "Some items are no longer available" },
          { status: 400 }
        );
      }
    }

    const subtotal = cartItems.reduce((sum, row) => {
      const item = row.items as unknown as { selling_price: number | null };
      return sum + Number(item.selling_price ?? 0);
    }, 0);

    const totalChf = computeCartCheckoutTotal(subtotal);
    const amountCents = chfToStripeCents(totalChf);

    if (amountCents < 50) {
      return NextResponse.json({ error: "Order total is too low" }, { status: 400 });
    }

    const itemIds = cartItems.map((row) => row.item_id).join(",");

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountCents,
      currency: "chf",
      metadata: {
        kind: "cart_checkout",
        cart_id: cart.id,
        buyer_id: user.id,
        item_ids: itemIds,
      },
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalChf,
    });
  } catch (error) {
    console.error("Create checkout intent error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
