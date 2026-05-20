/**
 * Failure-mode tests for the two fulfillment paths in webhook-handlers.ts.
 *
 * These cover the partial-write hazards: anywhere the fulfillment runs
 * multiple Supabase writes in sequence, an error at step N must THROW so
 * the webhook route catches it, marks the event FAILED, and Stripe retries
 * the delivery on its 3-day backoff schedule. Silent success here would
 * leak money or strand buyer items.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

import {
  fulfillCartCheckout,
  handlePaymentIntentSucceeded,
} from "./webhook-handlers";

// ----- helpers --------------------------------------------------------------

interface QResult {
  data: unknown;
  error: unknown;
}

function selectExistingTxChain(result: QResult) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function selectCartItemsChain(result: QResult) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(result),
    }),
  };
}

function insertTxChain(result: { error: unknown }) {
  return {
    insert: vi.fn().mockResolvedValue(result),
  };
}

function updateItemsChain(result: { error: unknown }) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function deleteCartItemsChain(result: { error: unknown }) {
  return {
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(result),
    }),
  };
}

const SAMPLE_CART_ITEM = {
  id: "ci-1",
  item_id: "item-1",
  items: {
    id: "item-1",
    owner_id: "seller-1",
    market_id: "market-1",
    selling_price: 50,
    status: "RESERVED",
  },
};

// ----- fulfillCartCheckout: early-return guards -----------------------------

describe("fulfillCartCheckout — early-return guards (silent no-op, not throw)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when cartId is undefined (no DB writes)", async () => {
    await fulfillCartCheckout({
      cartId: undefined,
      buyerId: "buyer-1",
      paymentIntentId: "pi_1",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("no-ops when buyerId is undefined (no DB writes)", async () => {
    await fulfillCartCheckout({
      cartId: "cart-1",
      buyerId: undefined,
      paymentIntentId: "pi_1",
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ----- fulfillCartCheckout: idempotency ------------------------------------

describe("fulfillCartCheckout — idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips silently when transactions already exist for this payment_intent_id", async () => {
    // The first .from('transactions') call returns >0 rows → skip.
    mockFrom.mockReturnValueOnce(
      selectExistingTxChain({ data: [{ id: "existing-tx" }], error: null })
    );

    await fulfillCartCheckout({
      cartId: "cart-1",
      buyerId: "buyer-1",
      paymentIntentId: "pi_already_processed",
    });

    // Should NOT proceed to cart_items fetch.
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("transactions");
  });

  it("does NOT skip when existingTx is an empty array", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({
          data: [],
          error: { message: "noop — but reached items fetch" },
        })
      );

    await expect(
      fulfillCartCheckout({
        cartId: "cart-1",
        buyerId: "buyer-1",
        paymentIntentId: "pi_first_time",
      })
    ).rejects.toThrow();

    expect(mockFrom).toHaveBeenCalledWith("cart_items");
  });
});

// ----- fulfillCartCheckout: partial-failure throws --------------------------

describe("fulfillCartCheckout — partial-failure paths (must THROW for Stripe retry)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when cart_items fetch fails (so the webhook is retried)", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({ data: null, error: { message: "db down" } })
      );

    await expect(
      fulfillCartCheckout({
        cartId: "cart-1",
        buyerId: "buyer-1",
        paymentIntentId: "pi_1",
      })
    ).rejects.toThrow(/cart checkout fulfillment failed/i);
  });

  it("throws when cart_items is empty (impossible if buyer paid — must surface as error)", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(selectCartItemsChain({ data: [], error: null }));

    await expect(
      fulfillCartCheckout({
        cartId: "cart-1",
        buyerId: "buyer-1",
        paymentIntentId: "pi_1",
      })
    ).rejects.toThrow(/no items/i);
  });

  it("throws mid-cart when transaction insert fails — partial state visible to caller", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({
          data: [SAMPLE_CART_ITEM, { ...SAMPLE_CART_ITEM, id: "ci-2", item_id: "item-2" }],
          error: null,
        })
      )
      .mockReturnValueOnce(insertTxChain({ error: { message: "fk violation" } }));

    await expect(
      fulfillCartCheckout({
        cartId: "cart-1",
        buyerId: "buyer-1",
        paymentIntentId: "pi_1",
      })
    ).rejects.toThrow(/Transaction insert failed: fk violation/);
  });

  it("throws when items.update fails (race: item changed status between fetch and update)", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({ data: [SAMPLE_CART_ITEM], error: null })
      )
      .mockReturnValueOnce(insertTxChain({ error: null }))
      .mockReturnValueOnce(
        updateItemsChain({ error: { message: "row not found at .eq(status,RESERVED)" } })
      );

    await expect(
      fulfillCartCheckout({
        cartId: "cart-1",
        buyerId: "buyer-1",
        paymentIntentId: "pi_1",
      })
    ).rejects.toThrow(/Item sold update failed/);
  });

  it("throws when final cart_items delete fails (cart not cleaned up)", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({ data: [SAMPLE_CART_ITEM], error: null })
      )
      .mockReturnValueOnce(insertTxChain({ error: null }))
      .mockReturnValueOnce(updateItemsChain({ error: null }))
      .mockReturnValueOnce(
        deleteCartItemsChain({ error: { message: "constraint" } })
      );

    await expect(
      fulfillCartCheckout({
        cartId: "cart-1",
        buyerId: "buyer-1",
        paymentIntentId: "pi_1",
      })
    ).rejects.toThrow(/Cart cleanup failed/);
  });
});

// ----- fulfillCartCheckout: happy path verifies side-effects ---------------

describe("fulfillCartCheckout — happy path side-effects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a transaction per cart item with 90/10 split and SOLD update", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const itemsEqSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const itemsUpdateSpy = vi.fn().mockReturnValue({ eq: itemsEqSpy });
    const deleteSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({
          data: [
            { ...SAMPLE_CART_ITEM, id: "ci-1", item_id: "item-1" },
            {
              ...SAMPLE_CART_ITEM,
              id: "ci-2",
              item_id: "item-2",
              items: {
                ...SAMPLE_CART_ITEM.items,
                id: "item-2",
                selling_price: 100,
              },
            },
          ],
          error: null,
        })
      )
      // Item 1: insert tx + update items
      .mockReturnValueOnce({ insert: insertSpy })
      .mockReturnValueOnce({ update: itemsUpdateSpy })
      // Item 2: insert tx + update items
      .mockReturnValueOnce({ insert: insertSpy })
      .mockReturnValueOnce({ update: itemsUpdateSpy })
      // Final: delete cart_items
      .mockReturnValueOnce({ delete: deleteSpy });

    await fulfillCartCheckout({
      cartId: "cart-1",
      buyerId: "buyer-1",
      paymentIntentId: "pi_happy",
      checkoutSessionId: "cs_test_123",
    });

    expect(insertSpy).toHaveBeenCalledTimes(2);
    // First insert: price 50 → fee 5, seller 45
    expect(insertSpy.mock.calls[0][0]).toMatchObject({
      type: "PURCHASE",
      status: "COMPLETED",
      total_amount: 50,
      platform_fee: 5,
      seller_amount: 45,
      stripe_payment_intent_id: "pi_happy",
      market_id: "market-1",
      buyer_id: "buyer-1",
      seller_id: "seller-1",
    });
    // Second insert: price 100 → fee 10, seller 90
    expect(insertSpy.mock.calls[1][0]).toMatchObject({
      total_amount: 100,
      platform_fee: 10,
      seller_amount: 90,
    });
    expect(itemsUpdateSpy).toHaveBeenCalledTimes(2);
    expect(deleteSpy).toHaveBeenCalled();
  });
});

// ----- fulfillHangerRental --------------------------------------------------

function rentalSingleChain(result: QResult) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function rentalInsertSelectSingleChain(result: QResult) {
  return {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function rentalUpdateChain(result: { error: unknown }) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function buildPaymentIntent(
  overrides: Partial<Stripe.PaymentIntent> = {}
): Stripe.PaymentIntent {
  return {
    id: "pi_rental_1",
    amount: 2500,
    metadata: {
      kind: "hanger_rental",
      rental_id: "rental-1",
      seller_id: "seller-1",
      market_id: "market-1",
    },
    ...overrides,
  } as Stripe.PaymentIntent;
}

function rentalEvent(pi: Stripe.PaymentIntent): Stripe.Event {
  return { type: "payment_intent.succeeded", data: { object: pi } } as Stripe.Event;
}

describe("fulfillHangerRental (via handlePaymentIntentSucceeded)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when rental_id missing (defensive: should not reach DB)", async () => {
    await handlePaymentIntentSucceeded(
      rentalEvent(
        buildPaymentIntent({
          metadata: { kind: "hanger_rental", seller_id: "seller-1" },
        })
      )
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("no-ops when seller_id missing", async () => {
    await handlePaymentIntentSucceeded(
      rentalEvent(
        buildPaymentIntent({
          metadata: { kind: "hanger_rental", rental_id: "rental-1" },
        })
      )
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("no-ops when rental row not found (no DB writes after lookup)", async () => {
    mockFrom.mockReturnValueOnce(rentalSingleChain({ data: null, error: null }));
    await handlePaymentIntentSucceeded(rentalEvent(buildPaymentIntent()));
    // Only the initial select — no insert, no update.
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("idempotent: skips when rental is already CONFIRMED", async () => {
    mockFrom.mockReturnValueOnce(
      rentalSingleChain({
        data: { id: "rental-1", status: "CONFIRMED", transaction_id: "tx-1" },
        error: null,
      })
    );
    await handlePaymentIntentSucceeded(rentalEvent(buildPaymentIntent()));
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("creates RENTAL transaction with platform_fee = full amount and seller_amount = 0", async () => {
    const insertChain = rentalInsertSelectSingleChain({
      data: { id: "tx-new" },
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(
        rentalSingleChain({
          data: { id: "rental-1", status: "PENDING", transaction_id: null },
          error: null,
        })
      )
      .mockReturnValueOnce(insertChain)
      .mockReturnValueOnce(rentalUpdateChain({ error: null }));

    // 5000 cents = CHF 50
    await handlePaymentIntentSucceeded(
      rentalEvent(buildPaymentIntent({ amount: 5000 }))
    );

    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RENTAL",
        status: "COMPLETED",
        buyer_id: "seller-1", // seller pays the rental
        seller_id: null,
        total_amount: 50,
        platform_fee: 50,
        seller_amount: 0,
        stripe_payment_intent_id: "pi_rental_1",
        market_id: "market-1",
        item_id: null,
      })
    );
  });

  it("throws when transaction insert fails (Stripe retries the webhook)", async () => {
    mockFrom
      .mockReturnValueOnce(
        rentalSingleChain({
          data: { id: "rental-1", status: "PENDING", transaction_id: null },
          error: null,
        })
      )
      .mockReturnValueOnce(
        rentalInsertSelectSingleChain({
          data: null,
          error: { message: "tx insert fail" },
        })
      );

    await expect(
      handlePaymentIntentSucceeded(rentalEvent(buildPaymentIntent()))
    ).rejects.toThrow(/Hanger rental transaction failed: tx insert fail/);
  });

  it("throws when rental status update fails — even though tx already inserted (data hazard)", async () => {
    mockFrom
      .mockReturnValueOnce(
        rentalSingleChain({
          data: { id: "rental-1", status: "PENDING", transaction_id: null },
          error: null,
        })
      )
      .mockReturnValueOnce(
        rentalInsertSelectSingleChain({ data: { id: "tx-1" }, error: null })
      )
      .mockReturnValueOnce(rentalUpdateChain({ error: { message: "update fail" } }));

    await expect(
      handlePaymentIntentSucceeded(rentalEvent(buildPaymentIntent()))
    ).rejects.toThrow(/Hanger rental confirm failed: update fail/);
  });

  it("market_id metadata is optional → tx.market_id = null without crashing", async () => {
    const insertChain = rentalInsertSelectSingleChain({
      data: { id: "tx-2" },
      error: null,
    });
    mockFrom
      .mockReturnValueOnce(
        rentalSingleChain({
          data: { id: "rental-1", status: "PENDING", transaction_id: null },
          error: null,
        })
      )
      .mockReturnValueOnce(insertChain)
      .mockReturnValueOnce(rentalUpdateChain({ error: null }));

    await handlePaymentIntentSucceeded(
      rentalEvent(
        buildPaymentIntent({
          metadata: {
            kind: "hanger_rental",
            rental_id: "rental-1",
            seller_id: "seller-1",
          },
        })
      )
    );

    expect(insertChain.insert.mock.calls[0][0]).toMatchObject({ market_id: null });
  });
});
