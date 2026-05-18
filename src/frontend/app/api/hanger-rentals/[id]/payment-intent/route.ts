import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { chfToStripeCents } from "@/lib/stripe/fees";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: rental, error: rentalError } = await supabase
      .from("hanger_rentals")
      .select("id, market_id, seller_id, total_price, status")
      .eq("id", params.id)
      .eq("seller_id", user.id)
      .single();

    if (rentalError || !rental) {
      return NextResponse.json({ error: "Rental not found" }, { status: 404 });
    }

    if (rental.status !== "PENDING") {
      return NextResponse.json({ error: "Rental is not awaiting payment" }, { status: 400 });
    }

    const totalPrice = Number(rental.total_price);
    const amountCents = chfToStripeCents(totalPrice);

    if (amountCents < 50) {
      return NextResponse.json({ error: "Amount too low" }, { status: 400 });
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: amountCents,
      currency: "chf",
      metadata: {
        kind: "hanger_rental",
        rental_id: rental.id,
        market_id: rental.market_id,
        seller_id: rental.seller_id,
      },
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalPrice,
    });
  } catch (error) {
    console.error("Hanger rental payment intent error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
