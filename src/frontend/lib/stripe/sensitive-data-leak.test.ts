/**
 * Cross-cutting sensitive-data-leak audit.
 *
 * Asserts that every error response from a Stripe-touching API route NEVER
 * contains any of the magic substrings we'd see if a secret accidentally
 * made it into a response body or header.
 *
 * If any of these tests starts failing, a recent change is forwarding a
 * Stripe SDK error / stack to the client. Find it and strip it.
 *
 * The test calls each route with synthetic inputs that force the route into
 * its error-catch path, then scans `res.text()` for forbidden substrings.
 *
 * Run with: `npx vitest run lib/stripe/sensitive-data-leak.test.ts`
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetUser,
  mockFrom,
  mockTransfersCreate,
  mockPaymentIntentsCreate,
  mockSessionsCreate,
  mockAccountLinksCreate,
  mockCheckRateLimit,
  mockRequireAdminServer,
  mockGetUserCart,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockTransfersCreate: vi.fn(),
  mockPaymentIntentsCreate: vi.fn(),
  mockSessionsCreate: vi.fn(),
  mockAccountLinksCreate: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockRequireAdminServer: vi.fn(),
  mockGetUserCart: vi.fn(),
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

vi.mock("@/lib/auth/utils", () => ({
  requireAdminServer: () => mockRequireAdminServer(),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    transfers: { create: mockTransfersCreate },
    paymentIntents: { create: mockPaymentIntentsCreate },
    checkout: { sessions: { create: mockSessionsCreate } },
    accountLinks: { create: mockAccountLinksCreate },
  }),
  getAppUrl: () => "https://app.bloem.test",
}));

vi.mock("@/features/carts/queries", () => ({
  getUserCart: mockGetUserCart,
}));

// ----- shared poison + scanner ---------------------------------------------

const POISON = {
  liveSecret: "sk_live_THIS_MUST_NEVER_LEAK_xyz1234567890",
  testSecret: "sk_test_THIS_MUST_NEVER_LEAK_abc1234567890",
  webhookSecret: "whsec_THIS_MUST_NEVER_LEAK_def9876543210",
  apiKeyEnv: "rk_THIS_MUST_NEVER_LEAK_xyz",
};

function poisonedError(): Error & { stack: string } {
  const err = new Error(
    `Stripe error containing ${POISON.liveSecret} and ${POISON.webhookSecret}`
  );
  err.stack = `Trace including ${POISON.testSecret} and ${POISON.apiKeyEnv}`;
  return err as Error & { stack: string };
}

async function assertNoLeak(res: Response): Promise<void> {
  const body = await res.text();
  // Combine body + headers; both surfaces are returned to the client.
  const surface = body + " " + JSON.stringify(Object.fromEntries(res.headers));
  expect(surface).not.toContain(POISON.liveSecret);
  expect(surface).not.toContain(POISON.testSecret);
  expect(surface).not.toContain(POISON.webhookSecret);
  expect(surface).not.toContain(POISON.apiKeyEnv);
  // Generic safety: no `sk_live_` / `sk_test_` / `whsec_` substrings at all.
  expect(surface).not.toMatch(/sk_(live|test)_[A-Za-z0-9_]+/);
  expect(surface).not.toMatch(/whsec_[A-Za-z0-9]+/);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  mockCheckRateLimit.mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: 0,
  });
});

// ----- the audit -----------------------------------------------------------

describe("Stripe routes never leak secret material in responses", () => {
  it("admin/payouts (transfers.create throws with poisoned stack)", async () => {
    const { POST } = await import("../../app/api/admin/payouts/route");
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
    const sel = (data: unknown) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error: null }),
      then: (cb: (v: { data: unknown; error: null }) => unknown) =>
        Promise.resolve(cb({ data, error: null })),
    });
    let n = 0;
    mockFrom.mockImplementation(() => {
      n++;
      switch (n) {
        case 1: return sel({ role: "ADMIN" }) as never;
        case 2: return sel([{ seller_amount: 100 }]) as never;
        case 3: return sel([]) as never;
        case 4: return sel({
          first_name: "A",
          last_name: "B",
          iban: "x",
          bank_name: "x",
          account_holder_name: "AB",
          stripe_account_id: "acct_1",
          stripe_payouts_enabled: true,
        }) as never;
        case 5: return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "p1" }, error: null }),
            }),
          }),
        } as never;
        default: return sel(null) as never;
      }
    });
    mockTransfersCreate.mockRejectedValue(poisonedError());

    const res = await POST(
      new Request("http://x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: "11111111-1111-4111-8111-111111111111",
          sellerId: "22222222-2222-4222-8222-222222222222",
        }),
      }) as never
    );
    await assertNoLeak(res);
  });

  it("hanger-rentals/[id]/payment-intent (paymentIntents.create throws)", async () => {
    const { POST } = await import(
      "../../app/api/hanger-rentals/[id]/payment-intent/route"
    );
    mockGetUser.mockResolvedValue({ data: { user: { id: "seller-1" } } });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "rental-1",
                market_id: "market-1",
                seller_id: "seller-1",
                total_price: 25,
                status: "PENDING",
              },
              error: null,
            }),
          }),
        }),
      }),
    });
    mockPaymentIntentsCreate.mockRejectedValue(poisonedError());

    const res = await POST(
      new Request("http://x", { method: "POST" }) as never,
      { params: { id: "rental-1" } }
    );
    await assertNoLeak(res);
  });

  it("checkout/create-session (sessions.create throws)", async () => {
    const { POST } = await import(
      "../../app/api/checkout/create-session/route"
    );
    mockGetUser.mockResolvedValue({
      data: { user: { id: "buyer-1", email: "b@x.com" } },
    });
    const future = new Date(Date.now() + 60_000).toISOString();
    const ch = (data: unknown) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data, error: null }),
      gt: vi.fn().mockResolvedValue({ data, error: null }),
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "carts")
        return ch({ id: "cart-1", updated_at: "2026-05-19T10:00:00Z" }) as never;
      return ch([
        {
          id: "ci-1",
          item_id: "i-1",
          expires_at: future,
          items: {
            id: "i-1",
            title: "X",
            selling_price: 25,
            status: "RESERVED",
            owner_id: "s",
          },
        },
      ]) as never;
    });
    mockSessionsCreate.mockRejectedValue(poisonedError());

    const res = await POST();
    await assertNoLeak(res);
  });

  it("admin/users/[id]/stripe-reverify (accountLinks.create throws)", async () => {
    const { POST } = await import(
      "../../app/api/admin/users/[id]/stripe-reverify/route"
    );
    mockRequireAdminServer.mockResolvedValue({ id: "a", role: "ADMIN" });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "u-1",
              email: "x@x.com",
              first_name: "X",
              last_name: "Y",
              stripe_account_id: "acct_existing",
              stripe_details_submitted: false,
            },
            error: null,
          }),
        }),
      }),
    });
    mockAccountLinksCreate.mockRejectedValue(poisonedError());

    const res = await POST(
      new Request("http://x", { method: "POST" }) as never,
      { params: { id: "u-1" } }
    );
    await assertNoLeak(res);
  });
});
