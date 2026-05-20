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

import { POST } from "./route";

const MARKET_ID = "11111111-1111-4111-8111-111111111111";

function buildSelectSingleChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
  return chain as never;
}

function request() {
  return new Request(`http://localhost/api/markets/${MARKET_ID}/register`, {
    method: "POST",
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null });
});

describe("POST /api/markets/[id]/register", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await POST(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when profile is missing", async () => {
    mockFrom.mockReturnValue(
      buildSelectSingleChain({ data: null, error: { message: "no rows" } })
    );
    const res = await POST(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(404);
  });

  it("returns 403 when seller is not Stripe-Connect activated", async () => {
    mockFrom.mockReturnValue(
      buildSelectSingleChain({
        data: { id: "u-1", stripe_payouts_enabled: false },
        error: null,
      })
    );
    const res = await POST(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/seller not activated/i);
  });

  it("returns 404 when market is not visible (status filter or end_date past)", async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return buildSelectSingleChain({
          data: { id: "u-1", stripe_payouts_enabled: true },
          error: null,
        });
      }
      return buildSelectSingleChain({
        data: null,
        error: { message: "not visible" },
      });
    });
    const res = await POST(request(), { params: { id: MARKET_ID } });
    expect(res.status).toBe(404);
  });
});
