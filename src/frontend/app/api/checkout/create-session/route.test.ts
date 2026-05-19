import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockSessionsCreate = vi.fn();

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
  getAppUrl: () => "http://localhost:3000",
  getStripe: () => ({
    checkout: {
      sessions: {
        create: mockSessionsCreate,
      },
    },
  }),
}));

function buildCartQueryChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    gt: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

describe("POST /api/checkout/create-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: 0,
      disabled: false,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST();
    expect(response.status).toBe(401);
  });

  it("returns 400 when cart is empty", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "carts") {
        return buildCartQueryChain({ data: null, error: { message: "missing" } });
      }
      return buildCartQueryChain({ data: [], error: null });
    });

    const response = await POST();
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toMatch(/empty/i);
  });

  it("returns 400 when reservations expired", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockFrom.mockImplementation((table: string) => {
      if (table === "carts") {
        return buildCartQueryChain({
          data: { id: "cart-1", updated_at: "2026-05-19T10:00:00Z" },
          error: null,
        });
      }
      return buildCartQueryChain({ data: [], error: null });
    });

    const response = await POST();
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toMatch(/empty|expired/i);
  });

  it("returns 200 with session client secret", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1", email: "buyer@example.com" } } });
    mockSessionsCreate.mockResolvedValue({
      id: "cs_test_123",
      client_secret: "cs_test_secret",
    });

    const expiredAt = new Date(Date.now() + 60_000).toISOString();

    mockFrom.mockImplementation((table: string) => {
      if (table === "carts") {
        return buildCartQueryChain({
          data: { id: "cart-1", updated_at: "2026-05-19T10:00:00Z" },
          error: null,
        });
      }
      return buildCartQueryChain({
        data: [
          {
            id: "ci-1",
            item_id: "item-1",
            expires_at: expiredAt,
            items: {
              id: "item-1",
              title: "Vintage jacket",
              selling_price: 25,
              status: "RESERVED",
              owner_id: "seller-1",
            },
          },
        ],
        error: null,
      });
    });

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.clientSecret).toBe("cs_test_secret");
    expect(body.sessionId).toBe("cs_test_123");
    expect(body.amount).toBeGreaterThan(0);
    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        ui_mode: "elements",
        currency: "chf",
        customer_email: "buyer@example.com",
        metadata: expect.objectContaining({ kind: "cart_checkout", cart_id: "cart-1" }),
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining("cart-checkout-elements-v2-cart-1"),
      })
    );
  });
});
