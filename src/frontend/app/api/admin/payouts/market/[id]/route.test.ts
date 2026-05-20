/**
 * Tests for GET /api/admin/payouts/market/[id].
 *
 * Returns a list of sellers with positive amounts owed for the given market.
 * Critical invariants:
 *   - Sellers with amountOwed <= 0 must be filtered out.
 *   - amountOwed math = sum(seller_amount of COMPLETED PURCHASE tx)
 *                     − sum(amount of REQUESTED/PROCESSING/COMPLETED payouts).
 *   - Admin-only.
 *   - profiles.in() with empty seller list must use a sentinel UUID so the
 *     query is well-formed (route uses "00000000-...").
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { GET } from "./route";

const MARKET_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_USER = { id: "admin-1" };

function selectChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: (cb: (v: typeof result) => unknown) => Promise.resolve(cb(result)),
  };
  return chain as never;
}

function request() {
  return new Request(
    `http://localhost/api/admin/payouts/market/${MARKET_ID}`
  ) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/payouts/market/[id]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await GET(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not ADMIN", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockFrom.mockReturnValueOnce(
      selectChain({ data: { role: "USER" }, error: null })
    );
    const res = await GET(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(403);
  });

  it("returns 403 when profile row is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockFrom.mockReturnValueOnce(selectChain({ data: null, error: null }));
    const res = await GET(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(403);
  });

  it("returns 500 when sales query errors", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockFrom
      .mockReturnValueOnce(selectChain({ data: { role: "ADMIN" }, error: null }))
      .mockReturnValueOnce(selectChain({ data: null, error: { message: "down" } }));
    const res = await GET(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(500);
  });

  it("returns 500 when payouts query errors", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockFrom
      .mockReturnValueOnce(selectChain({ data: { role: "ADMIN" }, error: null }))
      .mockReturnValueOnce(selectChain({ data: [], error: null }))
      .mockReturnValueOnce(selectChain({ data: null, error: { message: "down" } }));
    const res = await GET(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(500);
  });

  it("computes amountOwed per seller as sales_sum minus payouts_sum (positive only)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockFrom
      .mockReturnValueOnce(selectChain({ data: { role: "ADMIN" }, error: null }))
      // sales: 3 transactions across 2 sellers
      .mockReturnValueOnce(
        selectChain({
          data: [
            { seller_id: "seller-A", seller_amount: 50 },
            { seller_id: "seller-A", seller_amount: 30 },
            { seller_id: "seller-B", seller_amount: 100 },
          ],
          error: null,
        })
      )
      // existing payouts: B already got 60
      .mockReturnValueOnce(
        selectChain({
          data: [{ seller_id: "seller-B", amount: 60, status: "COMPLETED" }],
          error: null,
        })
      )
      // profiles for both sellers
      .mockReturnValueOnce(
        selectChain({
          data: [
            {
              id: "seller-A",
              first_name: "Alice",
              last_name: "Doe",
              email: "alice@example.com",
              stripe_account_id: "acct_A",
              stripe_payouts_enabled: true,
            },
            {
              id: "seller-B",
              first_name: "Bob",
              last_name: "Smith",
              email: "bob@example.com",
              stripe_account_id: "acct_B",
              stripe_payouts_enabled: false,
            },
          ],
          error: null,
        })
      );

    const res = await GET(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.marketId).toBe(MARKET_ID);
    expect(body.data.sellers).toHaveLength(2);

    const alice = body.data.sellers.find((s: { sellerId: string }) => s.sellerId === "seller-A");
    expect(alice).toMatchObject({
      name: "Alice Doe",
      email: "alice@example.com",
      stripeAccountId: "acct_A",
      stripeReady: true,
      amountOwed: 80, // 50+30 = 80, no prior payouts
    });

    const bob = body.data.sellers.find((s: { sellerId: string }) => s.sellerId === "seller-B");
    expect(bob).toMatchObject({
      name: "Bob Smith",
      stripeAccountId: "acct_B",
      stripeReady: false,
      amountOwed: 40, // 100 - 60
    });
  });

  it("excludes sellers whose net amount is zero or negative", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockFrom
      .mockReturnValueOnce(selectChain({ data: { role: "ADMIN" }, error: null }))
      .mockReturnValueOnce(
        selectChain({
          data: [
            { seller_id: "seller-A", seller_amount: 50 },
            { seller_id: "seller-B", seller_amount: 100 },
          ],
          error: null,
        })
      )
      // Both sellers already paid in full (A: 50 paid, B: 100 paid)
      .mockReturnValueOnce(
        selectChain({
          data: [
            { seller_id: "seller-A", amount: 50, status: "COMPLETED" },
            { seller_id: "seller-B", amount: 100, status: "COMPLETED" },
          ],
          error: null,
        })
      )
      // profiles lookup with empty sellerIds → route falls back to nil UUID
      .mockReturnValueOnce(selectChain({ data: [], error: null }));

    const res = await GET(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.sellers).toEqual([]);
  });

  it("skips transactions with null seller_id (defensive)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockFrom
      .mockReturnValueOnce(selectChain({ data: { role: "ADMIN" }, error: null }))
      .mockReturnValueOnce(
        selectChain({
          data: [
            { seller_id: null, seller_amount: 50 }, // skipped
            { seller_id: "seller-A", seller_amount: 25 },
          ],
          error: null,
        })
      )
      .mockReturnValueOnce(selectChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectChain({
          data: [
            {
              id: "seller-A",
              first_name: "A",
              last_name: "Z",
              email: "a@z.com",
              stripe_account_id: "acct_1",
              stripe_payouts_enabled: true,
            },
          ],
          error: null,
        })
      );

    const res = await GET(request(), { params: { id: MARKET_ID } });
    const body = await res.json();
    // The null-seller row contributes nothing; A gets 25.
    expect(body.data.sellers).toHaveLength(1);
    expect(body.data.sellers[0].amountOwed).toBe(25);
  });

  it("rounds amounts to 2 decimal places (rappen precision)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER }, error: null });
    mockFrom
      .mockReturnValueOnce(selectChain({ data: { role: "ADMIN" }, error: null }))
      .mockReturnValueOnce(
        selectChain({
          data: [
            { seller_id: "seller-A", seller_amount: 33.333 },
            { seller_id: "seller-A", seller_amount: 16.667 },
          ],
          error: null,
        })
      )
      .mockReturnValueOnce(selectChain({ data: [], error: null }))
      .mockReturnValueOnce(
        selectChain({
          data: [
            {
              id: "seller-A",
              first_name: "A",
              last_name: "Z",
              email: "a@z.com",
              stripe_account_id: "acct_1",
              stripe_payouts_enabled: true,
            },
          ],
          error: null,
        })
      );

    const res = await GET(request(), { params: { id: MARKET_ID } });
    const body = await res.json();
    expect(body.data.sellers[0].amountOwed).toBe(50); // 33.333 + 16.667 → rounded
  });
});
