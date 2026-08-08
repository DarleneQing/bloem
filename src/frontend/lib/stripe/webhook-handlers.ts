import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { computePurchaseFees, stripeCentsToChf } from "@/lib/stripe/fees";
import { syncStripeAccountToProfile } from "@/lib/stripe/profile-sync";

export async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  await syncStripeAccountToProfile(account);
}

/**
 * The paid set is whatever `app/api/checkout/create-session` recorded in
 * `metadata.item_ids` (a comma-joined list of item UUIDs). It is the only
 * trustworthy record of what the buyer was actually charged for — the live
 * cart can have drifted (new items added, reservations reaped) between
 * session creation and webhook delivery.
 */
export function parseCheckoutItemIds(itemIds: string | undefined): string[] {
  return (itemIds ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
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
    itemIds: parseCheckoutItemIds(session.metadata.item_ids),
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

  // 0 rows is legitimate here (no PENDING transaction was ever recorded), so
  // only a hard error is worth failing the event for.
  const { error } = await supabase
    .from("transactions")
    .update({ status: "FAILED", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .eq("status", "PENDING");

  if (error) {
    throw new Error(`Transaction FAILED update failed: ${error.message}`);
  }
}

export async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) return;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("transactions")
    .update({ status: "REFUNDED", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) {
    throw new Error(`Transaction REFUNDED update failed: ${error.message}`);
  }
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

  const { error } = await supabase.from("payouts").update(updates).eq("id", payoutId);

  if (error) {
    throw new Error(`Payout transfer update failed: ${error.message}`);
  }
}

interface CartCheckoutFulfillmentInput {
  cartId: string | undefined;
  buyerId: string | undefined;
  /** Item ids the buyer was charged for, from Stripe session metadata. */
  itemIds: string[];
  paymentIntentId: string;
  checkoutSessionId?: string;
}

export async function fulfillCartCheckout(input: CartCheckoutFulfillmentInput) {
  const { cartId, buyerId, itemIds, paymentIntentId, checkoutSessionId } = input;
  if (!cartId || !buyerId) return;

  if (!itemIds.length) {
    // The buyer has been charged but we cannot tell for what. Fail loudly so
    // the event lands in FAILED and a human reconciles it.
    throw new Error(
      `Cart checkout fulfillment failed: session metadata item_ids missing for ${paymentIntentId}`
    );
  }

  const supabase = createServiceClient();

  // Idempotency is per item, not per payment intent: a previous delivery may
  // have died part-way through the cart, leaving some items unfulfilled.
  const { data: existingTx, error: existingTxError } = await supabase
    .from("transactions")
    .select("item_id")
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (existingTxError) {
    throw new Error(`Cart checkout idempotency check failed: ${existingTxError.message}`);
  }

  const recordedItemIds = new Set(
    (existingTx ?? []).map((tx: { item_id: string | null }) => tx.item_id)
  );

  // Always fetch the FULL paid set, never just the unrecorded remainder.
  // cart_items has a BEFORE DELETE trigger (return_item_to_rack_on_cart_removal,
  // migrations 024/045) that puts any still-RESERVED item back on the RACK. If we
  // skipped an already-recorded item here it would stay RESERVED, and the delete
  // below — or the 5-minute reaper — would put a *paid* item back on sale.
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
    .eq("cart_id", cartId)
    .in("item_id", itemIds);

  if (itemsError) {
    throw new Error(`Cart checkout fulfillment failed: ${itemsError.message}`);
  }

  const cartRows = cartItems ?? [];
  const processedItemIds = cartRows.map((row: { item_id: string }) => row.item_id);
  const foundItemIds = new Set(processedItemIds);

  // cleanup_expired_cart_items() deletes cart_items row-by-row on expires_at, so
  // rows from one checkout disappear independently and regardless of item status.
  // A missing row therefore proves nothing on its own — but the rows that ARE
  // still here can be fulfilled, so deal with them before failing the event.
  const missingItemIds = itemIds.filter((id) => !foundItemIds.has(id));

  if (!cartRows.length) {
    // Everything reaped. This is a completed fulfillment only if every paid item
    // has both its transaction and SOLD status; an empty cart alone is not
    // evidence, since the reaper does not care what state the item is in.
    const unrecorded = itemIds.filter((id) => !recordedItemIds.has(id));
    if (unrecorded.length) {
      throw new Error(
        `Cart checkout fulfillment failed: cart ${cartId} has no rows for unrecorded paid items: ${unrecorded.join(", ")}`
      );
    }

    const { data: paidItems, error: paidItemsError } = await supabase
      .from("items")
      .select("id, status")
      .in("id", itemIds);

    if (paidItemsError) {
      throw new Error(`Cart checkout fulfillment failed: ${paidItemsError.message}`);
    }

    const statusById = new Map(
      (paidItems ?? []).map((row: { id: string; status: string }) => [row.id, row.status] as const)
    );
    const notSold = itemIds.filter((id) => statusById.get(id) !== "SOLD");

    if (notSold.length) {
      throw new Error(
        `Cart checkout fulfillment failed: paid items are not SOLD after cart cleanup: ${notSold.join(", ")}`
      );
    }

    return;
  }

  const now = new Date().toISOString();

  for (const row of cartRows) {
    const item = row.items as unknown as {
      id: string;
      owner_id: string;
      market_id: string | null;
      selling_price: number | null;
      status: string;
    };

    // Only the transaction insert is skipped for an already-recorded item; the
    // SOLD update below still runs so the item cannot be left RESERVED.
    const alreadyRecorded = recordedItemIds.has(item.id);

    if (!alreadyRecorded) {
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
    }

    // .select() so a 0-row match (item no longer RESERVED) is detectable —
    // Supabase reports no error when an update matches nothing.
    const { data: soldRows, error: soldError } = await supabase
      .from("items")
      .update({
        status: "SOLD",
        sold_at: now,
        buyer_id: buyerId,
        updated_at: now,
      })
      .eq("id", item.id)
      .eq("status", "RESERVED")
      .select("id");

    if (soldError) {
      throw new Error(`Item sold update failed: ${soldError.message}`);
    }

    if (!soldRows?.length) {
      // 0 rows is only legitimate for an item whose transaction was already
      // recorded AND which a previous delivery had already driven to SOLD.
      // Anything else means the item is not in the state we paid for.
      if (!alreadyRecorded || item.status !== "SOLD") {
        throw new Error(
          `Item sold update matched no rows for item ${item.id} (status ${item.status}, expected RESERVED)`
        );
      }
    }
  }

  // Only the paid rows we just drove to SOLD leave the cart — anything the buyer
  // added after checkout started keeps its reservation.
  const { error: deleteError } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId)
    .in("item_id", processedItemIds);

  if (deleteError) {
    throw new Error(`Cart cleanup failed: ${deleteError.message}`);
  }

  // Surviving items are now safe, so fail the event for the reaped ones: they
  // were paid for and their cart rows are gone, which needs a human.
  if (missingItemIds.length) {
    throw new Error(
      `Cart checkout fulfillment failed: paid items missing from cart ${cartId}: ${missingItemIds.join(", ")}`
    );
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

  // maybeSingle, not single: .single() reports "0 rows" as an error (PGRST116),
  // which would collapse "row is missing" into "the read failed". They need
  // different answers.
  const { data: rental, error: rentalFetchError } = await supabase
    .from("hanger_rentals")
    .select("id, status, transaction_id")
    .eq("id", rentalId)
    .maybeSingle();

  if (rentalFetchError) {
    throw new Error(`Hanger rental lookup failed: ${rentalFetchError.message}`);
  }

  if (!rental) {
    throw new Error(
      `Payment ${paymentIntent.id} succeeded for unknown hanger rental ${rentalId}`
    );
  }

  if (rental.status === "CONFIRMED") {
    return;
  }

  if (rental.status === "CANCELLED") {
    // Payment landed on a rental we already cancelled. Recording a COMPLETED
    // transaction would report success for a slot the seller no longer has —
    // this needs a refund, so surface it instead of swallowing it.
    throw new Error(
      `Hanger rental ${rentalId} is CANCELLED but payment ${paymentIntent.id} succeeded — refund required`
    );
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

  const { data: confirmedRows, error: rentalError } = await supabase
    .from("hanger_rentals")
    .update({
      status: "CONFIRMED",
      payment_confirmed_at: now,
      transaction_id: transaction.id,
      updated_at: now,
    })
    .eq("id", rentalId)
    .eq("status", "PENDING")
    .select("id");

  if (rentalError) {
    throw new Error(`Hanger rental confirm failed: ${rentalError.message}`);
  }

  if (!confirmedRows?.length) {
    throw new Error(
      `Hanger rental confirm matched no rows for ${rentalId} (expected status PENDING)`
    );
  }
}
