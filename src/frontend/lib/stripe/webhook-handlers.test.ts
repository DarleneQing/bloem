import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { fulfillCartCheckout, handleCheckoutSessionCompleted } from "./webhook-handlers";

const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockLimit = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/stripe/profile-sync", () => ({
  syncStripeAccountToProfile: vi.fn(),
}));

function mockTransactionsExisting(existing: { id: string }[]) {
  mockLimit.mockResolvedValue({ data: existing, error: null });
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: mockLimit,
      }),
    }),
    insert: mockInsert,
  };
}

function mockCartFulfillmentChain(
  cartItems: Array<{
    id: string;
    item_id: string;
    items: {
      id: string;
      owner_id: string;
      market_id: string | null;
      selling_price: number;
      status: string;
    };
  }>
) {
  const itemsUpdate = {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  };

  mockFrom.mockImplementation((table: string) => {
    if (table === "transactions") {
      return mockTransactionsExisting([]);
    }
    if (table === "cart_items") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: cartItems, error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    if (table === "items") {
      return itemsUpdate;
    }
    return mockTransactionsExisting([]);
  });

  mockInsert.mockResolvedValue({ error: null });
}

describe("handleCheckoutSessionCompleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores non-cart sessions", async () => {
    await handleCheckoutSessionCompleted({
      data: {
        object: {
          id: "cs_other",
          metadata: { kind: "other" },
          payment_intent: "pi_123",
        },
      },
    } as Stripe.Event);

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("fulfills cart checkout from session metadata", async () => {
    mockCartFulfillmentChain([
      {
        id: "ci-1",
        item_id: "item-1",
        items: {
          id: "item-1",
          owner_id: "seller-1",
          market_id: "market-1",
          selling_price: 20,
          status: "RESERVED",
        },
      },
    ]);

    await handleCheckoutSessionCompleted({
      data: {
        object: {
          id: "cs_test",
          metadata: {
            kind: "cart_checkout",
            cart_id: "cart-1",
            buyer_id: "buyer-1",
          },
          payment_intent: "pi_test",
        },
      },
    } as Stripe.Event);

    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("fulfillCartCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips when transactions already exist for payment intent", async () => {
    mockFrom.mockImplementation(() => mockTransactionsExisting([{ id: "tx-1" }]));

    await fulfillCartCheckout({
      cartId: "cart-1",
      buyerId: "buyer-1",
      paymentIntentId: "pi_existing",
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
