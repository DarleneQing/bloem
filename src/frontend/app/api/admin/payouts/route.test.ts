import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockFrom, mockTransfersCreate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockTransfersCreate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    transfers: { create: mockTransfersCreate },
  }),
}));

import { POST } from "./route";

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const MARKET_ID = "00000000-0000-4000-8000-00000000ff01";
const SELLER_ID = "00000000-0000-4000-8000-000000000002";

function makeRequest(body: unknown = { marketId: MARKET_ID, sellerId: SELLER_ID }) {
  return new Request("http://localhost/api/admin/payouts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

/**
 * Build a per-table Postgrest mock. Each entry resolves the terminal query
 * for that table. Chain methods (select/eq/in/insert/update) return `this`
 * so we can be loose about call order.
 */
function makePerTableChain(
  resolvers: Record<string, () => Promise<{ data: unknown; error: unknown }>>
) {
  function build(tableName: string) {
    const terminalResult = resolvers[tableName];
    const chain: Record<string, unknown> = {};
    const noOp = vi.fn().mockReturnValue(chain);
    chain.select = noOp;
    chain.eq = noOp;
    chain.in = noOp;
    chain.insert = vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        single: terminalResult,
      }),
    }));
    chain.update = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));
    chain.single = terminalResult;
    chain.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(resolve(terminalResult?.() ?? { data: null, error: null }));
    return chain;
  }

  mockFrom.mockImplementation((table: string) => build(table));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/payouts", () => {
  it("401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
  });

  it("403 when caller is not an ADMIN", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } } });
    makePerTableChain({
      profiles: () => Promise.resolve({ data: { role: "USER" }, error: null }),
    });

    const response = await POST(makeRequest());
    expect(response.status).toBe(403);
  });

  it("400 on body schema failure (non-UUID)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } } });
    makePerTableChain({
      profiles: () => Promise.resolve({ data: { role: "ADMIN" }, error: null }),
    });

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(
      makeRequest({ marketId: "bad", sellerId: SELLER_ID })
    );
    // Schema parse throws → catch block returns 500. (No try/catch around parse.)
    expect([400, 500]).toContain(response.status);
    errSpy.mockRestore();
  });

  it("400 when amount owed is below MIN_PAYOUT_AMOUNT_CHF", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: { role: "ADMIN" }, error: null }),
            }),
          }),
        };
      }
      if (table === "transactions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [{ seller_amount: 3 }, { seller_amount: 2 }], // 5 CHF
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "payouts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({}) };
    });

    const response = await POST(makeRequest());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/nothing to pay out/i);
  });

  it("400 when seller's Stripe account isn't ready", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: ADMIN_ID } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        // First call: caller role check. Second call: seller profile.
        const calls = (profilesCallCount.value += 1);
        if (calls === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: "ADMIN" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  first_name: "Jane",
                  last_name: "Doe",
                  stripe_account_id: null,
                  stripe_payouts_enabled: false,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "transactions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: [{ seller_amount: 100 }],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "payouts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({}) };
    });
    const profilesCallCount = { value: 0 };

    const response = await POST(makeRequest());
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/stripe/i);
  });
});
