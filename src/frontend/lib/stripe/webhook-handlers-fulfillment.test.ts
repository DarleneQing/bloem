/**
 * Failure-mode tests for the two fulfillment paths in webhook-handlers.ts.
 *
 * These cover the partial-write hazards: anywhere the fulfillment runs
 * multiple Supabase writes in sequence, an error at step N must THROW so
 * the webhook route catches it, marks the event FAILED, and Stripe retries
 * the delivery on its 3-day backoff schedule. Silent success here would
 * leak money or strand buyer items.
 *
 * Two invariants get special attention:
 *   - the fulfilled set comes from `session.metadata.item_ids` (what the
 *     buyer was charged for), never from the live cart;
 *   - an `.update()` that matches 0 rows returns no error from Supabase, so
 *     every money-path update asserts on the rows it got back.
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

/** transactions: .select("item_id").eq("stripe_payment_intent_id", …) */
function selectExistingTxChain(result: QResult) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(result),
    }),
  };
}

/** cart_items: .select(…).eq("cart_id", …).in("item_id", […]) */
function selectCartItemsChain(result: QResult) {
  const inSpy = vi.fn().mockResolvedValue(result);
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ in: inSpy }),
    }),
    inSpy,
  };
}

function insertTxChain(result: { error: unknown }) {
  return {
    insert: vi.fn().mockResolvedValue(result),
  };
}

/** items: .update(…).eq("id", …).eq("status","RESERVED").select("id") */
function updateItemsChain(result: QResult) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  };
}

/** cart_items: .delete().eq("cart_id", …).in("item_id", […]) */
function deleteCartItemsChain(result: { error: unknown }) {
  const inSpy = vi.fn().mockResolvedValue(result);
  return {
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ in: inSpy }),
    }),
    inSpy,
  };
}

const SOLD_OK = { data: [{ id: "item-1" }], error: null };

function cartItem(id: string, sellingPrice = 50) {
  return {
    id: `ci-${id}`,
    item_id: id,
    items: {
      id,
      owner_id: "seller-1",
      market_id: "market-1",
      selling_price: sellingPrice,
      status: "RESERVED",
    },
  };
}

const SAMPLE_CART_ITEM = cartItem("item-1");

function input(overrides: Record<string, unknown> = {}) {
  return {
    cartId: "cart-1",
    buyerId: "buyer-1",
    itemIds: ["item-1"],
    paymentIntentId: "pi_1",
    ...overrides,
  } as Parameters<typeof fulfillCartCheckout>[0];
}

// ----- fulfillCartCheckout: early-return guards -----------------------------

describe("fulfillCartCheckout — early-return guards (silent no-op, not throw)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when cartId is undefined (no DB writes)", async () => {
    await fulfillCartCheckout(input({ cartId: undefined }));
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("no-ops when buyerId is undefined (no DB writes)", async () => {
    await fulfillCartCheckout(input({ buyerId: undefined }));
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ----- fulfillCartCheckout: metadata drives the fulfilled set ---------------

describe("fulfillCartCheckout — the paid set comes from session metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when item_ids metadata is missing (buyer charged for unknown items)", async () => {
    await expect(fulfillCartCheckout(input({ itemIds: [] }))).rejects.toThrow(
      /item_ids missing for pi_1/
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("queries cart_items scoped to the paid item ids, not the whole cart", async () => {
    const cartChain = selectCartItemsChain({
      data: [cartItem("item-1"), cartItem("item-2")],
      error: null,
    });
    const deleteChain = deleteCartItemsChain({ error: null });

    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(cartChain)
      .mockReturnValueOnce(insertTxChain({ error: null }))
      .mockReturnValueOnce(updateItemsChain(SOLD_OK))
      .mockReturnValueOnce(insertTxChain({ error: null }))
      .mockReturnValueOnce(updateItemsChain(SOLD_OK))
      .mockReturnValueOnce(deleteChain);

    await fulfillCartCheckout(input({ itemIds: ["item-1", "item-2"] }));

    expect(cartChain.inSpy).toHaveBeenCalledWith("item_id", ["item-1", "item-2"]);
  });

  it("deletes only the paid cart rows — items added after checkout stay reserved", async () => {
    const deleteChain = deleteCartItemsChain({ error: null });

    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({ data: [SAMPLE_CART_ITEM], error: null })
      )
      .mockReturnValueOnce(insertTxChain({ error: null }))
      .mockReturnValueOnce(updateItemsChain(SOLD_OK))
      .mockReturnValueOnce(deleteChain);

    await fulfillCartCheckout(input());

    expect(deleteChain.inSpy).toHaveBeenCalledWith("item_id", ["item-1"]);
  });

  it("throws when a paid item has no cart row (cannot price what was charged)", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({ data: [cartItem("item-1")], error: null })
      );

    await expect(
      fulfillCartCheckout(input({ itemIds: ["item-1", "item-2"] }))
    ).rejects.toThrow(/paid items missing from cart cart-1: item-2/);
  });
});

// ----- fulfillCartCheckout: per-item idempotency ---------------------------

describe("fulfillCartCheckout — per-item idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips silently when every paid item already has a transaction", async () => {
    mockFrom.mockReturnValueOnce(
      selectExistingTxChain({
        data: [{ item_id: "item-1" }, { item_id: "item-2" }],
        error: null,
      })
    );

    await fulfillCartCheckout(input({ itemIds: ["item-1", "item-2"] }));

    // Should NOT proceed to the cart_items fetch.
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("transactions");
  });

  it("resumes a half-finished delivery: processes only the unrecorded items", async () => {
    const cartChain = selectCartItemsChain({
      data: [cartItem("item-2", 100)],
      error: null,
    });
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const deleteChain = deleteCartItemsChain({ error: null });

    mockFrom
      // item-1 already fulfilled by a previous (crashed) delivery.
      .mockReturnValueOnce(
        selectExistingTxChain({ data: [{ item_id: "item-1" }], error: null })
      )
      .mockReturnValueOnce(cartChain)
      .mockReturnValueOnce({ insert: insertSpy })
      .mockReturnValueOnce(updateItemsChain(SOLD_OK))
      .mockReturnValueOnce(deleteChain);

    await fulfillCartCheckout(input({ itemIds: ["item-1", "item-2"] }));

    // Only item-2 is re-fetched and re-charged...
    expect(cartChain.inSpy).toHaveBeenCalledWith("item_id", ["item-2"]);
    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy.mock.calls[0][0]).toMatchObject({ item_id: "item-2" });
    // ...but both paid rows leave the cart.
    expect(deleteChain.inSpy).toHaveBeenCalledWith("item_id", ["item-1", "item-2"]);
  });

  it("does NOT skip when no transactions exist yet", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({
          data: [],
          error: { message: "noop — but reached items fetch" },
        })
      );

    await expect(fulfillCartCheckout(input())).rejects.toThrow();

    expect(mockFrom).toHaveBeenCalledWith("cart_items");
  });

  it("throws when the idempotency lookup itself errors (never assume unfulfilled)", async () => {
    mockFrom.mockReturnValueOnce(
      selectExistingTxChain({ data: null, error: { message: "db down" } })
    );

    await expect(fulfillCartCheckout(input())).rejects.toThrow(
      /idempotency check failed: db down/
    );
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

    await expect(fulfillCartCheckout(input())).rejects.toThrow(
      /cart checkout fulfillment failed/i
    );
  });

  it("throws when cart_items is empty (impossible if buyer paid — must surface as error)", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(selectCartItemsChain({ data: [], error: null }));

    await expect(fulfillCartCheckout(input())).rejects.toThrow(/no items/i);
  });

  it("throws mid-cart when transaction insert fails — partial state visible to caller", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({
          data: [cartItem("item-1"), cartItem("item-2")],
          error: null,
        })
      )
      .mockReturnValueOnce(insertTxChain({ error: { message: "fk violation" } }));

    await expect(
      fulfillCartCheckout(input({ itemIds: ["item-1", "item-2"] }))
    ).rejects.toThrow(/Transaction insert failed: fk violation/);
  });

  it("throws when items.update errors (race: item changed status between fetch and update)", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({ data: [SAMPLE_CART_ITEM], error: null })
      )
      .mockReturnValueOnce(insertTxChain({ error: null }))
      .mockReturnValueOnce(
        updateItemsChain({ data: null, error: { message: "deadlock detected" } })
      );

    await expect(fulfillCartCheckout(input())).rejects.toThrow(
      /Item sold update failed/
    );
  });

  it("throws when the SOLD update matches 0 rows (no error, but nothing changed)", async () => {
    // Supabase returns { data: [], error: null } when .eq("status","RESERVED")
    // matches nothing — the silent-failure this whole task exists to close.
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({ data: [SAMPLE_CART_ITEM], error: null })
      )
      .mockReturnValueOnce(insertTxChain({ error: null }))
      .mockReturnValueOnce(updateItemsChain({ data: [], error: null }));

    await expect(fulfillCartCheckout(input())).rejects.toThrow(
      /matched no rows for item item-1 \(expected status RESERVED\)/
    );
  });

  it("throws when final cart_items delete fails (cart not cleaned up)", async () => {
    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({ data: [SAMPLE_CART_ITEM], error: null })
      )
      .mockReturnValueOnce(insertTxChain({ error: null }))
      .mockReturnValueOnce(updateItemsChain(SOLD_OK))
      .mockReturnValueOnce(deleteCartItemsChain({ error: { message: "constraint" } }));

    await expect(fulfillCartCheckout(input())).rejects.toThrow(/Cart cleanup failed/);
  });
});

// ----- fulfillCartCheckout: happy path verifies side-effects ---------------

describe("fulfillCartCheckout — happy path side-effects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a transaction per paid item with 90/10 split and SOLD update", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const itemsUpdateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue(SOLD_OK),
        }),
      }),
    });
    const deleteChain = deleteCartItemsChain({ error: null });

    mockFrom
      .mockReturnValueOnce(selectExistingTxChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectCartItemsChain({
          data: [cartItem("item-1", 50), cartItem("item-2", 100)],
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
      .mockReturnValueOnce(deleteChain);

    await fulfillCartCheckout(
      input({
        itemIds: ["item-1", "item-2"],
        paymentIntentId: "pi_happy",
        checkoutSessionId: "cs_test_123",
      })
    );

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
    expect(deleteChain.delete).toHaveBeenCalled();
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

/** hanger_rentals: .update(…).eq("id",…).eq("status","PENDING").select("id") */
function rentalUpdateChain(result: QResult) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue(result),
        }),
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

  it("throws when the rental lookup errors (do not treat a read failure as absent)", async () => {
    mockFrom.mockReturnValueOnce(
      rentalSingleChain({ data: null, error: { message: "connection reset" } })
    );

    await expect(
      handlePaymentIntentSucceeded(rentalEvent(buildPaymentIntent()))
    ).rejects.toThrow(/Hanger rental lookup failed: connection reset/);
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

  it("throws (no COMPLETED tx) when the rental was already CANCELLED — refund required", async () => {
    mockFrom.mockReturnValueOnce(
      rentalSingleChain({
        data: { id: "rental-1", status: "CANCELLED", transaction_id: null },
        error: null,
      })
    );

    await expect(
      handlePaymentIntentSucceeded(rentalEvent(buildPaymentIntent()))
    ).rejects.toThrow(/CANCELLED but payment pi_rental_1 succeeded — refund required/);
    // Critically: no transaction insert happened.
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
      .mockReturnValueOnce(
        rentalUpdateChain({ data: [{ id: "rental-1" }], error: null })
      );

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

  it("throws when rental status update errors — even though tx already inserted (data hazard)", async () => {
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
      .mockReturnValueOnce(
        rentalUpdateChain({ data: null, error: { message: "update fail" } })
      );

    await expect(
      handlePaymentIntentSucceeded(rentalEvent(buildPaymentIntent()))
    ).rejects.toThrow(/Hanger rental confirm failed: update fail/);
  });

  it("throws when the confirm update matches 0 rows (status raced away from PENDING)", async () => {
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
      .mockReturnValueOnce(rentalUpdateChain({ data: [], error: null }));

    await expect(
      handlePaymentIntentSucceeded(rentalEvent(buildPaymentIntent()))
    ).rejects.toThrow(/confirm matched no rows for rental-1 \(expected status PENDING\)/);
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
      .mockReturnValueOnce(
        rentalUpdateChain({ data: [{ id: "rental-1" }], error: null })
      );

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
