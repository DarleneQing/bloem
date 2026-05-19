import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { computePurchaseFees, stripeCentsToChf } from "@/lib/stripe/fees";
import { syncStripeAccountToProfile } from "@/lib/stripe/profile-sync";

export async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  await syncStripeAccountToProfile(account);
}

export function cartCheckoutFulfillmentFromSession(
  session: Stripe.Checkout.Session
): CartCheckoutFulfillmentInput | null {
  if (session.metadata?.kind !== "cart_checkout") {
    return null;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    return null;
  }

  return {
    cartId: session.metadata.cart_id,
    buyerId: session.metadata.buyer_id,
    paymentIntentId,
    checkoutSessionId: session.id,
  };
}

export async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const fulfillment = cartCheckoutFulfillmentFromSession(session);

  if (!fulfillment) {
    return;
  }

  if (!fulfillment.cartId || !fulfillment.buyerId) {
    return;
  }

  await fulfillCartCheckout(fulfillment);
}

export async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const kind = paymentIntent.metadata?.kind;

  if (kind === "hanger_rental") {
    await fulfillHangerRental(paymentIntent);
  }
}

export async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const supabase = createServiceClient();

  await supabase
    .from("transactions")
    .update({ status: "FAILED", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .eq("status", "PENDING");
}

export async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const supabase = createServiceClient();
  await supabase
    .from("transactions")
    .update({ status: "REFUNDED", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntentId);
}

export async function handleTransferEvent(event: Stripe.Event) {
  const transfer = event.data.object as Stripe.Transfer;
  const payoutId = transfer.metadata?.payout_id;
  if (!payoutId) return;

  const supabase = createServiceClient();
  const updates: Record<string, unknown> = {
    stripe_transfer_id: transfer.id,
    updated_at: new Date().toISOString(),
  };

  if (event.type === "transfer.created") {
    updates.status = "PROCESSING";
    updates.processed_at = new Date().toISOString();
  } else if (event.type === "transfer.reversed") {
    updates.status = "FAILED";
  }

  await supabase.from("payouts").update(updates).eq("id", payoutId);
}

interface CartCheckoutFulfillmentInput {
  cartId: string | undefined;
  buyerId: string | undefined;
  paymentIntentId: string;
  checkoutSessionId?: string;
}

export async function fulfillCartCheckout(input: CartCheckoutFulfillmentInput) {
  const { cartId, buyerId, paymentIntentId, checkoutSessionId } = input;
  if (!cartId || !buyerId) return;

  const supabase = createServiceClient();

  const { data: existingTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .limit(1);

  if (existingTx && existingTx.length > 0) {
    return;
  }

  const { data: cartItems, error: itemsError } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      item_id,
      items!inner(
        id,
        owner_id,
        market_id,
        selling_price,
        status
      )
    `
    )
    .eq("cart_id", cartId);

  if (itemsError || !cartItems?.length) {
    throw new Error(`Cart checkout fulfillment failed: ${itemsError?.message ?? "no items"}`);
  }

  const now = new Date().toISOString();

  for (const row of cartItems) {
    const item = row.items as unknown as {
      id: string;
      owner_id: string;
      market_id: string | null;
      selling_price: number | null;
      status: string;
    };

    const price = Number(item.selling_price ?? 0);
    const { platformFee, sellerAmount } = computePurchaseFees(price);

    const { error: txError } = await supabase.from("transactions").insert({
      type: "PURCHASE",
      status: "COMPLETED",
      buyer_id: buyerId,
      seller_id: item.owner_id,
      total_amount: price,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      stripe_payment_intent_id: paymentIntentId,
      market_id: item.market_id,
      item_id: item.id,
      created_at: now,
      updated_at: now,
    });

    if (txError) {
      throw new Error(`Transaction insert failed: ${txError.message}`);
    }

    const { error: soldError } = await supabase
      .from("items")
      .update({
        status: "SOLD",
        sold_at: now,
        buyer_id: buyerId,
        updated_at: now,
      })
      .eq("id", item.id)
      .eq("status", "RESERVED");

    if (soldError) {
      throw new Error(`Item sold update failed: ${soldError.message}`);
    }
  }

  const { error: deleteError } = await supabase.from("cart_items").delete().eq("cart_id", cartId);

  if (deleteError) {
    throw new Error(`Cart cleanup failed: ${deleteError.message}`);
  }

  if (checkoutSessionId) {
    console.info(`Cart checkout fulfilled for session ${checkoutSessionId}`);
  }
}

async function fulfillHangerRental(paymentIntent: Stripe.PaymentIntent) {
  const rentalId = paymentIntent.metadata?.rental_id;
  const sellerId = paymentIntent.metadata?.seller_id;
  const marketId = paymentIntent.metadata?.market_id;
  if (!rentalId || !sellerId) return;

  const supabase = createServiceClient();

  const { data: rental } = await supabase
    .from("hanger_rentals")
    .select("id, status, transaction_id")
    .eq("id", rentalId)
    .single();

  if (!rental || rental.status === "CONFIRMED") {
    return;
  }

  const totalAmount = stripeCentsToChf(paymentIntent.amount);
  const now = new Date().toISOString();

  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      type: "RENTAL",
      status: "COMPLETED",
      buyer_id: sellerId,
      seller_id: null,
      total_amount: totalAmount,
      platform_fee: totalAmount,
      seller_amount: 0,
      stripe_payment_intent_id: paymentIntent.id,
      market_id: marketId ?? null,
      item_id: null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (txError || !transaction) {
    throw new Error(`Hanger rental transaction failed: ${txError?.message}`);
  }

  const { error: rentalError } = await supabase
    .from("hanger_rentals")
    .update({
      status: "CONFIRMED",
      payment_confirmed_at: now,
      transaction_id: transaction.id,
      updated_at: now,
    })
    .eq("id", rentalId)
    .eq("status", "PENDING");

  if (rentalError) {
    throw new Error(`Hanger rental confirm failed: ${rentalError.message}`);
  }
}
