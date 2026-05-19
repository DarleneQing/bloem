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

type WebhookEventStatus = "PENDING" | "PROCESSED" | "FAILED";

async function getWebhookEventStatus(
  supabase: ReturnType<typeof createServiceClient>,
  eventId: string
): Promise<WebhookEventStatus | null> {
  const { data } = await supabase
    .from("stripe_webhook_events")
    .select("status")
    .eq("id", eventId)
    .maybeSingle();

  return (data?.status as WebhookEventStatus | undefined) ?? null;
}

async function claimWebhookEvent(
  supabase: ReturnType<typeof createServiceClient>,
  event: { id: string; type: string }
): Promise<"skip" | "process" | "error"> {
  const existingStatus = await getWebhookEventStatus(supabase, event.id);

  if (existingStatus === "PROCESSED") {
    return "skip";
  }

  if (existingStatus === "PENDING") {
    return "skip";
  }

  if (existingStatus === "FAILED") {
    const { error: resetError } = await supabase
      .from("stripe_webhook_events")
      .update({ status: "PENDING", processed_at: new Date().toISOString() })
      .eq("id", event.id);

    if (resetError) {
      console.error("Webhook retry reset failed:", resetError);
      return "error";
    }

    return "process";
  }

  const { error: insertError } = await supabase.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
    status: "PENDING",
  });

  if (insertError?.code === "23505") {
    const racedStatus = await getWebhookEventStatus(supabase, event.id);
    if (racedStatus === "PROCESSED" || racedStatus === "PENDING") {
      return "skip";
    }
    if (racedStatus === "FAILED") {
      return claimWebhookEvent(supabase, event);
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
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
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

    await supabase
      .from("stripe_webhook_events")
      .update({ status: "PROCESSED", processed_at: new Date().toISOString() })
      .eq("id", event.id);
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
