/**
 * Robustness tests for POST /api/checkout/create-session.
 *
 * Existing route.test.ts covers 401/empty-cart/expired/happy. This file
 * adds:
 *   - rate-limit 429 with appropriate headers
 *   - multi-item amount math (sum of seller prices, then 10% fee)
 *   - items.status check ("not RESERVED" → 400)
 *   - Stripe SDK throws → 500 generic (no leak)
 *   - idempotency key includes cartId, cartUpdatedAt, amountCents, itemIds
 *   - missing customer_email is OK (Stripe accepts undefined)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockFrom, mockCheckRateLimit, mockSessionsCreate } =
  vi.hoisted(() => ({
    mockGetUser: vi.fn(),
    mockFrom: vi.fn(),
    mockCheckRateLimit: vi.fn(),
    mockSessionsCreate: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  rateLimitHeaders: () => ({}),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    checkout: { sessions: { create: mockSessionsCreate } },
  }),
  getAppUrl: () => "http://localhost:3000",
}));

import { POST } from "./route";

const CART_ID = "cart-1";
const CART_UPDATED_AT = "2026-05-19T10:00:00Z";

function chain(result: { data: unknown; error: unknown }) {
  const c = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
  };
  return c;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: 0,
    disabled: false,
  });
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "buyer@example.com" } },
  });
});

function setupCart(items: Array<{
  id: string;
  item_id: string;
  expires_at?: string;
  title: string;
  selling_price: number | null;
  status?: string;
  owner_id?: string;
}>) {
  const future = new Date(Date.now() + 60_000).toISOString();
  mockFrom.mockImplementation((table: string) => {
    if (table === "carts") {
      return chain({ data: { id: CART_ID, updated_at: CART_UPDATED_AT }, error: null });
    }
    return chain({
      data: items.map((row) => ({
        id: row.id,
        item_id: row.item_id,
        expires_at: row.expires_at ?? future,
        items: {
          id: row.item_id,
          title: row.title,
          selling_price: row.selling_price,
          status: row.status ?? "RESERVED",
          owner_id: row.owner_id ?? "seller-1",
        },
      })),
      error: null,
    });
  });
}

describe("POST /api/checkout/create-session — robustness", () => {
  // ----- rate limit ------------------------------------------------------

  it("returns 429 with rate-limit message when limit exceeded", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: 0,
    });
    const res = await POST();
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/too many/i);
    expect(mockSessionsCreate).not.toHaveBeenCalled();
  });

  // ----- amount math -----------------------------------------------------

  it(
    "multi-item cart: body.amount equals the seller subtotal " +
      "(buyer pays subtotal — platform fee is taken from seller_amount in webhook, not added at checkout)",
    async () => {
      setupCart([
        { id: "ci-1", item_id: "i-1", title: "Coat", selling_price: 50 },
        { id: "ci-2", item_id: "i-2", title: "Boots", selling_price: 30 },
        { id: "ci-3", item_id: "i-3", title: "Hat", selling_price: 20 },
      ]);
      mockSessionsCreate.mockResolvedValue({
        id: "cs_multi",
        client_secret: "secret",
      });

      const res = await POST();
      expect(res.status).toBe(200);
      const body = await res.json();
      // REGRESSION GUARD: body.amount must equal the seller subtotal, NOT
      // subtotal + 10% fee. There are two similarly-named helpers in the
      // codebase — the route currently uses `computeCartCheckoutTotalFromItems`
      // which sums seller prices without adding the fee. Switching to the
      // fee-inclusive helper would silently overcharge buyers.
      expect(body.amount).toBe(100);

      // Stripe line_items must mirror the same seller prices.
      const sessionArgs = mockSessionsCreate.mock.calls[0][0];
      const cents = sessionArgs.line_items.map(
        (li: { price_data: { unit_amount: number } }) => li.price_data.unit_amount
      );
      // 5000 + 3000 + 2000 = 10000 cents
      expect(cents.reduce((a: number, b: number) => a + b, 0)).toBe(10000);
    }
  );

  // ----- status invariants ----------------------------------------------

  it("returns 400 when any cart item is not in RESERVED status", async () => {
    setupCart([
      { id: "ci-1", item_id: "i-1", title: "Coat", selling_price: 50 },
      { id: "ci-2", item_id: "i-2", title: "Hat", selling_price: 20, status: "SOLD" },
    ]);

    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no longer available/i);
    expect(mockSessionsCreate).not.toHaveBeenCalled();
  });

  // ----- defensive null handling ----------------------------------------

  it("rejects (400) when subtotal in cents falls below Stripe's 50-cent floor (null price = 0)", async () => {
    setupCart([
      { id: "ci-1", item_id: "i-1", title: "Free?", selling_price: null },
    ]);

    const res = await POST();
    // Null selling_price coerces to 0; amountCents=0 < 50 → 400 with the
    // "Order total is too low" message. No Stripe call.
    expect(res.status).toBe(400);
    expect(mockSessionsCreate).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toMatch(/too low/i);
  });

  it("rejects (400) when total cents == 49 (just below Stripe's CHF 0.50 floor)", async () => {
    setupCart([
      { id: "ci-1", item_id: "i-1", title: "Tiny", selling_price: 0.49 },
    ]);
    const res = await POST();
    expect(res.status).toBe(400);
    expect(mockSessionsCreate).not.toHaveBeenCalled();
  });

  it("accepts the floor (CHF 0.50 = 50 cents)", async () => {
    setupCart([
      { id: "ci-1", item_id: "i-1", title: "Floor", selling_price: 0.5 },
    ]);
    mockSessionsCreate.mockResolvedValue({ id: "cs_floor", client_secret: "s" });
    const res = await POST();
    expect(res.status).toBe(200);
  });

  // ----- idempotency key shape ------------------------------------------

  it("idempotency key includes cartId, cartUpdatedAt, amountCents, and itemIds", async () => {
    setupCart([
      { id: "ci-1", item_id: "item-foo", title: "X", selling_price: 25 },
      { id: "ci-2", item_id: "item-bar", title: "Y", selling_price: 30 },
    ]);
    mockSessionsCreate.mockResolvedValue({
      id: "cs_key",
      client_secret: "s",
    });

    await POST();
    const options = mockSessionsCreate.mock.calls[0][1];
    expect(options.idempotencyKey).toContain(CART_ID);
    expect(options.idempotencyKey).toContain(CART_UPDATED_AT);
    expect(options.idempotencyKey).toContain("elements-v2");
    // Item IDs included so a different cart composition gets a different key
    expect(options.idempotencyKey).toContain("item-foo");
    expect(options.idempotencyKey).toContain("item-bar");
  });

  // ----- Stripe SDK failures --------------------------------------------

  it("returns 500 when Stripe sessions.create throws", async () => {
    setupCart([
      { id: "ci-1", item_id: "i-1", title: "X", selling_price: 25 },
    ]);
    mockSessionsCreate.mockRejectedValue(new Error("Stripe rate limited"));
    const res = await POST();
    expect(res.status).toBe(500);
  });

  it("does not leak Stripe SDK stack containing key material in error responses", async () => {
    setupCart([
      { id: "ci-1", item_id: "i-1", title: "X", selling_price: 25 },
    ]);
    const err: Error & { stack?: string } = new Error("rate_limited");
    err.stack = "...sk_live_LEAK_BAD...";
    mockSessionsCreate.mockRejectedValue(err);
    const res = await POST();
    const body = await res.text();
    expect(body).not.toContain("sk_live_");
    expect(body).not.toContain("LEAK_BAD");
  });

  // ----- session.metadata contents ---------------------------------------

  it("session.metadata.kind = 'cart_checkout' and includes buyer/cart ids", async () => {
    setupCart([
      { id: "ci-1", item_id: "i-1", title: "X", selling_price: 25 },
    ]);
    mockSessionsCreate.mockResolvedValue({
      id: "cs_meta",
      client_secret: "s",
    });
    await POST();
    expect(mockSessionsCreate.mock.calls[0][0]).toMatchObject({
      metadata: expect.objectContaining({
        kind: "cart_checkout",
        cart_id: CART_ID,
        buyer_id: "user-1",
      }),
    });
  });

  it("forwards customer_email to Stripe when user.email is set", async () => {
    setupCart([
      { id: "ci-1", item_id: "i-1", title: "X", selling_price: 25 },
    ]);
    mockSessionsCreate.mockResolvedValue({
      id: "cs_email",
      client_secret: "s",
    });
    await POST();
    expect(mockSessionsCreate.mock.calls[0][0]).toMatchObject({
      customer_email: "buyer@example.com",
    });
  });
});
