/**
 * Hardening tests for POST /api/webhooks/stripe.
 *
 * The existing route.test.ts covers the happy paths for signature + idempotency.
 * This file pushes deeper into the failure surface that matters most for
 * payment safety:
 *
 *   1. **Signature verification MUST run before any DB write.** A forged
 *      webhook should never even insert a stripe_webhook_events row.
 *   2. **Handler errors marked FAILED** so the next Stripe retry picks them
 *      up — verified by tracking which update was called.
 *   3. **No secret leakage** in any 4xx/5xx response. The webhook secret
 *      is in env and is referenced by `constructEvent`; if the SDK echoes
 *      it back in an error, we must not pass it on.
 *   4. **Unknown event types** are silently accepted (200) — Stripe sends
 *      these regularly and rejecting them would cause the dashboard to
 *      mark our endpoint as unhealthy.
 */

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConstructEvent,
  mockHandleAccountUpdated,
  mockHandleChargeRefunded,
  mockHandleCheckoutSessionCompleted,
  mockHandlePaymentIntentFailed,
  mockHandlePaymentIntentSucceeded,
  mockHandleTransferEvent,
  mockFrom,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockHandleAccountUpdated: vi.fn(),
  mockHandleChargeRefunded: vi.fn(),
  mockHandleCheckoutSessionCompleted: vi.fn(),
  mockHandlePaymentIntentFailed: vi.fn(),
  mockHandlePaymentIntentSucceeded: vi.fn(),
  mockHandleTransferEvent: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
  }),
}));

vi.mock("@/lib/stripe/webhook-handlers", () => ({
  handleAccountUpdated: mockHandleAccountUpdated,
  handleChargeRefunded: mockHandleChargeRefunded,
  handleCheckoutSessionCompleted: mockHandleCheckoutSessionCompleted,
  handlePaymentIntentFailed: mockHandlePaymentIntentFailed,
  handlePaymentIntentSucceeded: mockHandlePaymentIntentSucceeded,
  handleTransferEvent: mockHandleTransferEvent,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

import { POST } from "./route";

const ORIGINAL_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const REAL_SECRET = "whsec_REAL_VALUE_FOR_TEST";

function request(opts: {
  body?: string;
  signature?: string | null;
}) {
  const headers: Record<string, string> = {};
  if (opts.signature) headers["stripe-signature"] = opts.signature;
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers,
    body: opts.body ?? "",
  }) as never;
}

function maybeSingleChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function insertChain(result: { error: unknown }) {
  return {
    insert: vi.fn().mockResolvedValue(result),
  };
}

function updateChain(result: { error: unknown }) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(result),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  process.env.STRIPE_WEBHOOK_SECRET = REAL_SECRET;
});

// ----- signature must run before any DB write ------------------------------

describe("signature verification is the first gate", () => {
  it("400 + zero DB writes when stripe-signature header is missing", async () => {
    const res = await POST(request({ body: '{"id":"evt_1"}' }));
    expect(res.status).toBe(400);
    expect(mockConstructEvent).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("400 + zero DB writes when signature is invalid", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching expected signature for payload");
    });
    const res = await POST(
      request({ body: '{"id":"evt_1"}', signature: "t=1,v1=baddeadbeef" })
    );
    expect(res.status).toBe(400);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("does not leak the webhook secret value in the 400 response", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error(`Sig mismatch ${REAL_SECRET}`);
    });
    const res = await POST(
      request({ body: '{"id":"evt"}', signature: "bad" })
    );
    const body = await res.text();
    expect(body).not.toContain(REAL_SECRET);
    expect(body).not.toMatch(/whsec_/);
  });

  it("500 when webhook secret is not configured (and never invokes constructEvent)", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(request({ body: "{}", signature: "any" }));
    expect(res.status).toBe(500);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });
});

// ----- handler errors mark events FAILED for retry -------------------------

describe("handler failures mark the event FAILED (Stripe retries)", () => {
  it("returns 500 AND updates status to FAILED when the handler throws", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_failed",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    // Idempotency: event is new → insert succeeds → process path.
    let n = 0;
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockFrom.mockImplementation(() => {
      n++;
      if (n === 1) return maybeSingleChain({ data: null, error: null }) as never; // lookup
      if (n === 2) return insertChain({ error: null }) as never; // claim insert
      // Subsequent updates (FAILED marking)
      return { update: updateSpy } as never;
    });

    mockHandleCheckoutSessionCompleted.mockRejectedValue(
      new Error("downstream Supabase outage")
    );

    const res = await POST(
      request({ body: "{}", signature: "valid" })
    );
    expect(res.status).toBe(500);

    // Last from() call should be the FAILED status update.
    const updateArgs = updateSpy.mock.calls[0]?.[0];
    expect(updateArgs).toMatchObject({ status: "FAILED" });
    expect(updateArgs).toHaveProperty("processed_at");
  });

  it("returns 200 for unknown event types and marks them PROCESSED", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_unknown",
      type: "customer.tax_id.created", // unknown — switch hits default
      data: { object: {} },
    });
    let n = 0;
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockFrom.mockImplementation(() => {
      n++;
      if (n === 1) return maybeSingleChain({ data: null, error: null }) as never;
      if (n === 2) return insertChain({ error: null }) as never;
      return { update: updateSpy } as never;
    });

    const res = await POST(request({ body: "{}", signature: "valid" }));
    expect(res.status).toBe(200);
    expect(updateSpy.mock.calls[0]?.[0]).toMatchObject({ status: "PROCESSED" });
  });
});

// ----- idempotency races ---------------------------------------------------

describe("idempotency races (defensive — Stripe can deliver same event >1x)", () => {
  function setupIdempotency(
    initialStatus: "PROCESSED" | "PENDING" | "FAILED" | null,
    onProcess?: () => void
  ) {
    let n = 0;
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockFrom.mockImplementation(() => {
      n++;
      if (n === 1) {
        return maybeSingleChain({
          data: initialStatus ? { status: initialStatus } : null,
          error: null,
        }) as never;
      }
      // After lookup, the route either: skips (PROCESSED/PENDING), resets
      // FAILED→PENDING (update), or inserts a new row.
      if (initialStatus === "FAILED") {
        if (n === 2) return { update: updateSpy } as never; // reset
        return { update: updateSpy } as never; // final PROCESSED
      }
      if (initialStatus === null) {
        if (n === 2) return { insert: insertSpy } as never;
        return { update: updateSpy } as never;
      }
      throw new Error(`unexpected from() call #${n}`);
    });
    if (onProcess) onProcess();
    return { insertSpy, updateSpy };
  }

  it("returns 200 (skip) for already-PROCESSED event without invoking a handler", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_done",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    setupIdempotency("PROCESSED");

    const res = await POST(request({ body: "{}", signature: "valid" }));
    expect(res.status).toBe(200);
    expect(mockHandleCheckoutSessionCompleted).not.toHaveBeenCalled();
  });

  it("returns 200 (skip) when another worker is mid-flight (PENDING)", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_inflight",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    setupIdempotency("PENDING");

    const res = await POST(request({ body: "{}", signature: "valid" }));
    expect(res.status).toBe(200);
    expect(mockHandleCheckoutSessionCompleted).not.toHaveBeenCalled();
  });

  it("resets FAILED→PENDING and re-processes the event (retry path)", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_retry",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    setupIdempotency("FAILED");
    mockHandleCheckoutSessionCompleted.mockResolvedValue(undefined);

    const res = await POST(request({ body: "{}", signature: "valid" }));
    expect(res.status).toBe(200);
    expect(mockHandleCheckoutSessionCompleted).toHaveBeenCalled();
  });
});

// ----- dispatch correctness -----------------------------------------------

describe("event-type dispatch", () => {
  function setupNew(eventType: string) {
    mockConstructEvent.mockReturnValue({
      id: `evt_${eventType}`,
      type: eventType,
      data: { object: {} },
    });
    let n = 0;
    mockFrom.mockImplementation(() => {
      n++;
      if (n === 1) return maybeSingleChain({ data: null, error: null }) as never;
      if (n === 2) return insertChain({ error: null }) as never;
      return updateChain({ error: null }) as never;
    });
  }

  it.each([
    ["account.updated", mockHandleAccountUpdated],
    ["checkout.session.completed", mockHandleCheckoutSessionCompleted],
    ["payment_intent.succeeded", mockHandlePaymentIntentSucceeded],
    ["payment_intent.payment_failed", mockHandlePaymentIntentFailed],
    ["charge.refunded", mockHandleChargeRefunded],
    ["transfer.created", mockHandleTransferEvent],
    ["transfer.reversed", mockHandleTransferEvent],
  ])("routes %s to the correct handler", async (type, handler) => {
    setupNew(type);
    await POST(request({ body: "{}", signature: "valid" }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("only invokes ONE handler per event (no cross-dispatch)", async () => {
    setupNew("checkout.session.completed");
    await POST(request({ body: "{}", signature: "valid" }));
    expect(mockHandleCheckoutSessionCompleted).toHaveBeenCalledTimes(1);
    expect(mockHandleAccountUpdated).not.toHaveBeenCalled();
    expect(mockHandlePaymentIntentSucceeded).not.toHaveBeenCalled();
    expect(mockHandlePaymentIntentFailed).not.toHaveBeenCalled();
    expect(mockHandleChargeRefunded).not.toHaveBeenCalled();
    expect(mockHandleTransferEvent).not.toHaveBeenCalled();
  });
});

// ----- cleanup -------------------------------------------------------------

afterAll(() => {
  process.env.STRIPE_WEBHOOK_SECRET = ORIGINAL_WEBHOOK_SECRET;
});
