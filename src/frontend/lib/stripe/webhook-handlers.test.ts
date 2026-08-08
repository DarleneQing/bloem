import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  fulfillCartCheckout,
  handleCheckoutSessionCompleted,
  parseCheckoutItemIds,
} from "./webhook-handlers";

const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockExistingTxEq = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/stripe/profile-sync", () => ({
  syncStripeAccountToProfile: vi.fn(),
}));

function mockTransactionsExisting(existing: { item_id: string }[]) {
  mockExistingTxEq.mockResolvedValue({ data: existing, error: null });
  return {
    select: vi.fn().mockReturnValue({
      eq: mockExistingTxEq,
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
        eq: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockResolvedValue({ data: [{ id: "updated" }], error: null }),
        }),
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
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: cartItems, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ error: null }),
          }),
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

describe("parseCheckoutItemIds", () => {
  it("splits the comma-joined metadata written by create-session", () => {
    expect(parseCheckoutItemIds("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("returns an empty list for undefined or blank metadata", () => {
    expect(parseCheckoutItemIds(undefined)).toEqual([]);
    expect(parseCheckoutItemIds("")).toEqual([]);
    expect(parseCheckoutItemIds(" , ,")).toEqual([]);
  });

  it("trims whitespace and drops empty segments", () => {
    expect(parseCheckoutItemIds(" a , b ,,c ")).toEqual(["a", "b", "c"]);
  });
});

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
    } as unknown as Stripe.Event);

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
            item_ids: "item-1",
          },
          payment_intent: "pi_test",
        },
      },
    } as unknown as Stripe.Event);

    expect(mockInsert).toHaveBeenCalled();
  });

  it("throws when a cart session carries no item_ids metadata", async () => {
    mockCartFulfillmentChain([]);

    await expect(
      handleCheckoutSessionCompleted({
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
      } as unknown as Stripe.Event)
    ).rejects.toThrow(/item_ids missing/);

    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("fulfillCartCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips when every paid item is transacted and the cart is already cleaned", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "cart_items") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      return mockTransactionsExisting([{ item_id: "item-1" }]);
    });

    await fulfillCartCheckout({
      cartId: "cart-1",
      buyerId: "buyer-1",
      itemIds: ["item-1"],
      paymentIntentId: "pi_existing",
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
