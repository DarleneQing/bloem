import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock() factories are hoisted above imports — use vi.hoisted() to share
// mock fns between the factory and the test body.
const {
  mockConstructEvent,
  mockFrom,
  mockHandleAccountUpdated,
  mockHandleCheckoutSessionCompleted,
  mockHandlePaymentIntentSucceeded,
  mockHandlePaymentIntentFailed,
  mockHandleChargeRefunded,
  mockHandleTransferEvent,
} = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  mockFrom: vi.fn(),
  mockHandleAccountUpdated: vi.fn(),
  mockHandleCheckoutSessionCompleted: vi.fn(),
  mockHandlePaymentIntentSucceeded: vi.fn(),
  mockHandlePaymentIntentFailed: vi.fn(),
  mockHandleChargeRefunded: vi.fn(),
  mockHandleTransferEvent: vi.fn(),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
  }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/stripe/webhook-handlers", () => ({
  handleAccountUpdated: mockHandleAccountUpdated,
  handleCheckoutSessionCompleted: mockHandleCheckoutSessionCompleted,
  handlePaymentIntentSucceeded: mockHandlePaymentIntentSucceeded,
  handlePaymentIntentFailed: mockHandlePaymentIntentFailed,
  handleChargeRefunded: mockHandleChargeRefunded,
  handleTransferEvent: mockHandleTransferEvent,
}));

import { POST } from "./route";

const ORIGINAL_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function makeRequest(opts: { signature?: string; body?: string } = {}) {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: opts.signature
      ? { "stripe-signature": opts.signature, "content-type": "application/json" }
      : { "content-type": "application/json" },
    body: opts.body ?? '{"foo": "bar"}',
  }) as never;
}

/**
 * Build a from() routing table that returns different chains per table.
 * The webhook does:
 *   - stripe_webhook_events.select(...).eq(...).maybeSingle()
 *   - stripe_webhook_events.insert({...})
 *   - stripe_webhook_events.update({...}).eq("id", ...)
 */
function buildWebhookEventsChain(opts: {
  existing?: { status: string } | null;
  insertError?: { code?: string; message?: string } | null;
  resetError?: { message?: string } | null;
}) {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: opts.existing ?? null, error: null });

  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle }),
    }),
    insert: vi.fn().mockResolvedValue({ error: opts.insertError ?? null }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: opts.resetError ?? null }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

describe("POST /api/webhooks/stripe — entry validation", () => {
  it("500 when STRIPE_WEBHOOK_SECRET unset", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const response = await POST(makeRequest({ signature: "sig" }));
    expect(response.status).toBe(500);
    process.env.STRIPE_WEBHOOK_SECRET = ORIGINAL_SECRET;
  });

  it("400 when stripe-signature header missing", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
  });

  it("400 when signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    const response = await POST(makeRequest({ signature: "bad" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/invalid/i);
  });
});

describe("POST /api/webhooks/stripe — idempotency claim", () => {
  it("returns 200 (skip) when event already PROCESSED", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
    });
    mockFrom.mockReturnValue(
      buildWebhookEventsChain({ existing: { status: "PROCESSED" } })
    );
    const response = await POST(makeRequest({ signature: "ok" }));
    expect(response.status).toBe(200);
    expect(mockHandleCheckoutSessionCompleted).not.toHaveBeenCalled();
  });

  it("returns 200 (skip) when another worker is PENDING the event", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_2",
      type: "account.updated",
    });
    mockFrom.mockReturnValue(
      buildWebhookEventsChain({ existing: { status: "PENDING" } })
    );
    const response = await POST(makeRequest({ signature: "ok" }));
    expect(response.status).toBe(200);
    expect(mockHandleAccountUpdated).not.toHaveBeenCalled();
  });

  it("inserts a new event row and processes when first seen", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_new",
      type: "account.updated",
    });
    const chain = buildWebhookEventsChain({ existing: null });
    mockFrom.mockReturnValue(chain);

    const response = await POST(makeRequest({ signature: "ok" }));
    expect(response.status).toBe(200);
    expect(chain.insert).toHaveBeenCalled();
    expect(mockHandleAccountUpdated).toHaveBeenCalledOnce();
    // Final update should mark as PROCESSED.
    const updateCalls = chain.update.mock.calls;
    expect(updateCalls.length).toBeGreaterThan(0);
    expect(updateCalls.at(-1)?.[0]).toMatchObject({ status: "PROCESSED" });
  });

  it("retries a previously FAILED event by resetting to PENDING", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_retry",
      type: "account.updated",
    });
    const chain = buildWebhookEventsChain({ existing: { status: "FAILED" } });
    mockFrom.mockReturnValue(chain);

    const response = await POST(makeRequest({ signature: "ok" }));
    expect(response.status).toBe(200);
    // First update resets to PENDING; final update marks PROCESSED.
    const updateValues = chain.update.mock.calls.map((c) => c[0]);
    expect(updateValues[0]).toMatchObject({ status: "PENDING" });
    expect(updateValues.at(-1)).toMatchObject({ status: "PROCESSED" });
  });
});

describe("POST /api/webhooks/stripe — dispatch by event type", () => {
  it.each([
    ["account.updated", "mockHandleAccountUpdated"],
    ["checkout.session.completed", "mockHandleCheckoutSessionCompleted"],
    ["payment_intent.succeeded", "mockHandlePaymentIntentSucceeded"],
    ["payment_intent.payment_failed", "mockHandlePaymentIntentFailed"],
    ["charge.refunded", "mockHandleChargeRefunded"],
    ["transfer.created", "mockHandleTransferEvent"],
    ["transfer.reversed", "mockHandleTransferEvent"],
  ])("routes %s to the right handler", async (eventType, _handlerName) => {
    mockConstructEvent.mockReturnValue({ id: `evt_${eventType}`, type: eventType });
    mockFrom.mockReturnValue(buildWebhookEventsChain({ existing: null }));

    const handlers: Record<string, ReturnType<typeof vi.fn>> = {
      mockHandleAccountUpdated,
      mockHandleCheckoutSessionCompleted,
      mockHandlePaymentIntentSucceeded,
      mockHandlePaymentIntentFailed,
      mockHandleChargeRefunded,
      mockHandleTransferEvent,
    };

    const response = await POST(makeRequest({ signature: "ok" }));
    expect(response.status).toBe(200);
    expect(handlers[_handlerName]).toHaveBeenCalledOnce();
  });

  it("ignores unknown event types and still returns 200", async () => {
    mockConstructEvent.mockReturnValue({ id: "evt_unknown", type: "ping" });
    mockFrom.mockReturnValue(buildWebhookEventsChain({ existing: null }));

    const response = await POST(makeRequest({ signature: "ok" }));
    expect(response.status).toBe(200);
    expect(mockHandleAccountUpdated).not.toHaveBeenCalled();
    expect(mockHandleCheckoutSessionCompleted).not.toHaveBeenCalled();
  });

  it("marks event FAILED and returns 500 if handler throws", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_boom",
      type: "account.updated",
    });
    const chain = buildWebhookEventsChain({ existing: null });
    mockFrom.mockReturnValue(chain);
    mockHandleAccountUpdated.mockRejectedValue(new Error("handler boom"));

    // Silence the expected console.error from the catch block.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(makeRequest({ signature: "ok" }));
    expect(response.status).toBe(500);
    expect(chain.update.mock.calls.at(-1)?.[0]).toMatchObject({
      status: "FAILED",
    });

    errSpy.mockRestore();
  });
});
