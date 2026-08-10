import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/server";
import {
  handleAccountUpdated,
  handleChargeRefunded,
  handleCheckoutSessionCompleted,
  handlePaymentIntentFailed,
  handlePaymentIntentSucceeded,
  handleTransferEvent,
} from "@/lib/stripe/webhook-handlers";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 30;

type WebhookEventStatus = "PENDING" | "PROCESSED" | "FAILED";

/**
 * A PENDING row is a lease held by whichever worker claimed the event. If that
 * worker died before writing PROCESSED/FAILED the row would stay PENDING
 * forever and every Stripe retry would be skipped — the payment silently never
 * fulfilled. After this long we assume the holder is gone and reclaim it.
 *
 * ponytail: timestamp lease, not a real lock. Two workers can reclaim the same
 * stale event concurrently; the handlers are individually idempotent, so the
 * worst case is duplicated work, not duplicated money. Move to a
 * `SELECT ... FOR UPDATE SKIP LOCKED` RPC if that stops being true.
 */
const STALE_PENDING_MS = 10 * 60 * 1000;

interface WebhookEventRow {
  status: WebhookEventStatus;
  processedAt: string | null;
}

async function getWebhookEvent(
  supabase: ReturnType<typeof createServiceClient>,
  eventId: string
): Promise<WebhookEventRow | null> {
  const { data } = await supabase
    .from("stripe_webhook_events")
    .select("status, processed_at")
    .eq("id", eventId)
    .maybeSingle();

  const status = data?.status as WebhookEventStatus | undefined;
  if (!status) return null;

  return { status, processedAt: (data?.processed_at as string | null) ?? null };
}

/** Unknown/unparseable timestamps count as fresh — never reclaim on a guess. */
function isStalePendingClaim(processedAt: string | null): boolean {
  if (!processedAt) return false;
  const claimedAt = Date.parse(processedAt);
  if (Number.isNaN(claimedAt)) return false;
  return Date.now() - claimedAt > STALE_PENDING_MS;
}

async function markPendingForProcessing(
  supabase: ReturnType<typeof createServiceClient>,
  eventId: string,
  reason: string
): Promise<"process" | "error"> {
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({ status: "PENDING", processed_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) {
    console.error(`Webhook ${reason} failed:`, error);
    return "error";
  }

  return "process";
}

async function claimWebhookEvent(
  supabase: ReturnType<typeof createServiceClient>,
  event: { id: string; type: string }
): Promise<"skip" | "process" | "error"> {
  const existing = await getWebhookEvent(supabase, event.id);
  const existingStatus = existing?.status ?? null;

  if (existingStatus === "PROCESSED") {
    return "skip";
  }

  if (existingStatus === "PENDING") {
    if (!isStalePendingClaim(existing?.processedAt ?? null)) {
      return "skip";
    }

    console.warn(`Reclaiming stale PENDING webhook event ${event.id}`);
    return markPendingForProcessing(supabase, event.id, "stale claim reset");
  }

  if (existingStatus === "FAILED") {
    return markPendingForProcessing(supabase, event.id, "retry reset");
  }

  const { error: insertError } = await supabase.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
    status: "PENDING",
  });

  if (insertError?.code === "23505") {
    // Lost an insert race. A row that just appeared is by definition fresh, so
    // PENDING here means another worker owns it — no staleness check needed.
    const raced = await getWebhookEvent(supabase, event.id);
    if (raced?.status === "PROCESSED" || raced?.status === "PENDING") {
      return "skip";
    }
    if (raced?.status === "FAILED") {
      return markPendingForProcessing(supabase, event.id, "retry reset");
    }
    return "error";
  }

  if (insertError) {
    console.error("Webhook idempotency insert failed:", insertError);
    return "error";
  }

  return "process";
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await request.text();
  let event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    // Log full error server-side; return a generic message so malformed or
    // forged deliveries can never coax secret material into the response.
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const claim = await claimWebhookEvent(supabase, event);

  if (claim === "error") {
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }

  if (claim === "skip") {
    return new NextResponse(null, { status: 200 });
  }

  try {
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event);
        break;
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event);
        break;
      case "transfer.created":
      case "transfer.reversed":
        await handleTransferEvent(event);
        break;
      default:
        break;
    }

    const { error: processedError } = await supabase
      .from("stripe_webhook_events")
      .update({ status: "PROCESSED", processed_at: new Date().toISOString() })
      .eq("id", event.id);

    if (processedError) {
      // The work succeeded but the row still reads PENDING. Returning 500 makes
      // Stripe redeliver; the handlers are idempotent, so a redelivery is far
      // cheaper than an event stuck PENDING forever.
      console.error("Webhook PROCESSED update failed:", processedError);
      return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
    }
  } catch (err) {
    console.error(`Stripe webhook handler error (${event.type}):`, err);
    await supabase
      .from("stripe_webhook_events")
      .update({ status: "FAILED", processed_at: new Date().toISOString() })
      .eq("id", event.id);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
