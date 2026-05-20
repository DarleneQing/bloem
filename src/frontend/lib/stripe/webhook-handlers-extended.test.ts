import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  cartCheckoutFulfillmentFromSession,
  handleAccountUpdated,
  handleChargeRefunded,
  handlePaymentIntentFailed,
  handlePaymentIntentSucceeded,
  handleTransferEvent,
} from "./webhook-handlers";

const mockFrom = vi.fn();
const syncStripeAccountToProfileMock = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/stripe/profile-sync", () => ({
  syncStripeAccountToProfile: (...args: unknown[]) =>
    syncStripeAccountToProfileMock(...args),
}));

/** Build a Postgrest-style update chain that records the values it received. */
function makeUpdateRecorder() {
  const calls: Array<{ values: unknown; eqArgs: unknown[] }> = [];
  const chain = {
    update: vi.fn((values: unknown) => {
      const inner = {
        eq: vi.fn(),
      };
      // Recursive .eq() builder — supports as many chained .eq() calls as needed.
      const eqArgs: unknown[] = [];
      const eqRecursive = (col: string, value: unknown) => {
        eqArgs.push([col, value]);
        const next = {
          eq: vi.fn((c2: string, v2: unknown) => eqRecursive(c2, v2)),
          then: (resolve: (v: { error: null }) => unknown) =>
            Promise.resolve(resolve({ error: null })),
        };
        return next;
      };
      inner.eq = vi.fn((col: string, value: unknown) => eqRecursive(col, value));
      calls.push({ values, eqArgs });
      // Allow direct await on .update() as well (no .eq path).
      // The handlers all chain .eq(), so this is just defensive.
      return inner;
    }),
  };
  return { chain, calls };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleAccountUpdated", () => {
  it("delegates to syncStripeAccountToProfile with the Account object", async () => {
    const account = { id: "acct_123", metadata: { bloem_user_id: "u-1" } };
    await handleAccountUpdated({
      data: { object: account },
    } as Stripe.Event);

    expect(syncStripeAccountToProfileMock).toHaveBeenCalledOnce();
    expect(syncStripeAccountToProfileMock).toHaveBeenCalledWith(account);
  });
});

describe("cartCheckoutFulfillmentFromSession", () => {
  it("returns null when metadata.kind is not cart_checkout", () => {
    expect(
      cartCheckoutFulfillmentFromSession({
        id: "cs_x",
        metadata: { kind: "other" },
        payment_intent: "pi_1",
      } as unknown as Stripe.Checkout.Session)
    ).toBeNull();
  });

  it("returns null when payment_intent is absent", () => {
    expect(
      cartCheckoutFulfillmentFromSession({
        id: "cs_x",
        metadata: { kind: "cart_checkout", cart_id: "c", buyer_id: "b" },
        payment_intent: null,
      } as unknown as Stripe.Checkout.Session)
    ).toBeNull();
  });

  it("extracts string payment_intent", () => {
    const result = cartCheckoutFulfillmentFromSession({
      id: "cs_x",
      metadata: { kind: "cart_checkout", cart_id: "c", buyer_id: "b" },
      payment_intent: "pi_string",
    } as unknown as Stripe.Checkout.Session);
    expect(result).toEqual({
      cartId: "c",
      buyerId: "b",
      paymentIntentId: "pi_string",
      checkoutSessionId: "cs_x",
    });
  });

  it("extracts payment_intent.id from expanded object", () => {
    const result = cartCheckoutFulfillmentFromSession({
      id: "cs_x",
      metadata: { kind: "cart_checkout", cart_id: "c", buyer_id: "b" },
      payment_intent: { id: "pi_object" },
    } as unknown as Stripe.Checkout.Session);
    expect(result?.paymentIntentId).toBe("pi_object");
  });
});

describe("handlePaymentIntentSucceeded", () => {
  it("no-ops when metadata.kind is not hanger_rental", async () => {
    await handlePaymentIntentSucceeded({
      data: {
        object: {
          id: "pi_x",
          metadata: { kind: "cart_checkout" },
        },
      },
    } as Stripe.Event);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("no-ops when rental_id metadata is missing", async () => {
    await handlePaymentIntentSucceeded({
      data: {
        object: {
          id: "pi_x",
          metadata: { kind: "hanger_rental", seller_id: "s-1" },
        },
      },
    } as Stripe.Event);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("handlePaymentIntentFailed", () => {
  it("updates PENDING transactions to FAILED keyed by payment_intent_id", async () => {
    const { chain, calls } = makeUpdateRecorder();
    mockFrom.mockReturnValue(chain);

    await handlePaymentIntentFailed({
      data: { object: { id: "pi_fail" } },
    } as Stripe.Event);

    expect(mockFrom).toHaveBeenCalledWith("transactions");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.values).toMatchObject({ status: "FAILED" });
    expect(calls[0]?.eqArgs).toContainEqual(["stripe_payment_intent_id", "pi_fail"]);
    expect(calls[0]?.eqArgs).toContainEqual(["status", "PENDING"]);
  });
});

describe("handleChargeRefunded", () => {
  it("does nothing when payment_intent is null", async () => {
    await handleChargeRefunded({
      data: { object: { id: "ch_1", payment_intent: null } },
    } as Stripe.Event);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("marks the transaction REFUNDED when given a string payment_intent", async () => {
    const { chain, calls } = makeUpdateRecorder();
    mockFrom.mockReturnValue(chain);

    await handleChargeRefunded({
      data: { object: { id: "ch_1", payment_intent: "pi_refund" } },
    } as Stripe.Event);

    expect(calls[0]?.values).toMatchObject({ status: "REFUNDED" });
    expect(calls[0]?.eqArgs).toContainEqual([
      "stripe_payment_intent_id",
      "pi_refund",
    ]);
  });

  it("handles expanded payment_intent object", async () => {
    const { chain, calls } = makeUpdateRecorder();
    mockFrom.mockReturnValue(chain);

    await handleChargeRefunded({
      data: { object: { id: "ch_2", payment_intent: { id: "pi_obj" } } },
    } as Stripe.Event);

    expect(calls[0]?.eqArgs).toContainEqual(["stripe_payment_intent_id", "pi_obj"]);
  });
});

describe("handleTransferEvent", () => {
  it("no-ops when metadata.payout_id is missing", async () => {
    await handleTransferEvent({
      type: "transfer.created",
      data: { object: { id: "tr_1", metadata: {} } },
    } as Stripe.Event);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("marks payouts PROCESSING on transfer.created and sets processed_at", async () => {
    const { chain, calls } = makeUpdateRecorder();
    mockFrom.mockReturnValue(chain);

    await handleTransferEvent({
      type: "transfer.created",
      data: { object: { id: "tr_2", metadata: { payout_id: "p-1" } } },
    } as Stripe.Event);

    expect(mockFrom).toHaveBeenCalledWith("payouts");
    expect(calls[0]?.values).toMatchObject({
      stripe_transfer_id: "tr_2",
      status: "PROCESSING",
    });
    expect(calls[0]?.values).toHaveProperty("processed_at");
    expect(calls[0]?.eqArgs).toContainEqual(["id", "p-1"]);
  });

  it("marks payouts FAILED on transfer.reversed", async () => {
    const { chain, calls } = makeUpdateRecorder();
    mockFrom.mockReturnValue(chain);

    await handleTransferEvent({
      type: "transfer.reversed",
      data: { object: { id: "tr_3", metadata: { payout_id: "p-2" } } },
    } as Stripe.Event);

    expect(calls[0]?.values).toMatchObject({
      stripe_transfer_id: "tr_3",
      status: "FAILED",
    });
    // transfer.reversed does NOT set processed_at.
    expect(calls[0]?.values).not.toHaveProperty("processed_at");
  });

  it("only updates stripe_transfer_id on unrelated transfer.* event types", async () => {
    const { chain, calls } = makeUpdateRecorder();
    mockFrom.mockReturnValue(chain);

    await handleTransferEvent({
      type: "transfer.updated",
      data: { object: { id: "tr_4", metadata: { payout_id: "p-3" } } },
    } as Stripe.Event);

    expect(calls[0]?.values).toMatchObject({ stripe_transfer_id: "tr_4" });
    expect(calls[0]?.values).not.toHaveProperty("status");
  });
});
