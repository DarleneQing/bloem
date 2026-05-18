import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";
import { chfToStripeCents, MIN_PAYOUT_AMOUNT_CHF } from "@/lib/stripe/fees";

const payoutBodySchema = z.object({
  marketId: z.string().uuid(),
  sellerId: z.string().uuid(),
});

async function computeSellerOwed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  marketId: string,
  sellerId: string
) {
  const { data: sales } = await supabase
    .from("transactions")
    .select("seller_amount")
    .eq("market_id", marketId)
    .eq("seller_id", sellerId)
    .eq("type", "PURCHASE")
    .eq("status", "COMPLETED");

  const { data: paid } = await supabase
    .from("payouts")
    .select("amount")
    .eq("market_id", marketId)
    .eq("seller_id", sellerId)
    .in("status", ["REQUESTED", "PROCESSING", "COMPLETED"]);

  const gross = (sales ?? []).reduce((sum, r) => sum + Number(r.seller_amount), 0);
  const paidOut = (paid ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  return Math.round((gross - paidOut) * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminProfile || adminProfile.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = payoutBodySchema.parse(await request.json());
    const { marketId, sellerId } = body;

    const amountOwed = await computeSellerOwed(supabase, marketId, sellerId);

    if (amountOwed < MIN_PAYOUT_AMOUNT_CHF) {
      return NextResponse.json({ error: "Nothing to pay out for this seller" }, { status: 400 });
    }

    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select(
        "first_name, last_name, iban, bank_name, account_holder_name, stripe_account_id, stripe_payouts_enabled"
      )
      .eq("id", sellerId)
      .single();

    if (!sellerProfile?.stripe_account_id || !sellerProfile.stripe_payouts_enabled) {
      return NextResponse.json({ error: "Seller Stripe account is not ready" }, { status: 400 });
    }

    const accountHolder =
      sellerProfile.account_holder_name ??
      `${sellerProfile.first_name} ${sellerProfile.last_name}`.trim();

    const { data: payoutRow, error: insertError } = await supabase
      .from("payouts")
      .insert({
        seller_id: sellerId,
        market_id: marketId,
        amount: amountOwed,
        status: "REQUESTED",
        iban: sellerProfile.iban ?? "STRIPE",
        bank_name: sellerProfile.bank_name ?? "Stripe Connect",
        account_holder_name: accountHolder,
      })
      .select("id")
      .single();

    if (insertError || !payoutRow) {
      return NextResponse.json({ error: insertError?.message ?? "Insert failed" }, { status: 500 });
    }

    const transfer = await getStripe().transfers.create({
      amount: chfToStripeCents(amountOwed),
      currency: "chf",
      destination: sellerProfile.stripe_account_id,
      metadata: {
        payout_id: payoutRow.id,
        market_id: marketId,
        seller_id: sellerId,
      },
    });

    await supabase
      .from("payouts")
      .update({
        stripe_transfer_id: transfer.id,
        status: "PROCESSING",
        processed_at: new Date().toISOString(),
      })
      .eq("id", payoutRow.id);

    return NextResponse.json({
      data: {
        payoutId: payoutRow.id,
        transferId: transfer.id,
        amount: amountOwed,
      },
    });
  } catch (error) {
    console.error("Admin payout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
