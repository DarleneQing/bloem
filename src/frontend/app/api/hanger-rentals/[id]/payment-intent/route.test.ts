import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockPaymentIntentsCreate = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    paymentIntents: { create: mockPaymentIntentsCreate },
  }),
}));

function rentalQueryChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  };
}

const RENTAL_ID = "33333333-3333-4333-8333-333333333333";
const SELLER_ID = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest() {
  return new Request("http://localhost/x", { method: "POST" }) as never;
}

describe("POST /api/hanger-rentals/[id]/payment-intent", () => {
  it("401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(makeRequest(), { params: { id: RENTAL_ID } });
    expect(response.status).toBe(401);
  });

  it("404 when rental not found (or not owned by user)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: SELLER_ID } } });
    mockFrom.mockReturnValue(rentalQueryChain({ data: null, error: { message: "missing" } }));
    const response = await POST(makeRequest(), { params: { id: RENTAL_ID } });
    expect(response.status).toBe(404);
  });

  it("400 when rental status is not PENDING", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: SELLER_ID } } });
    mockFrom.mockReturnValue(
      rentalQueryChain({
        data: {
          id: RENTAL_ID,
          market_id: "m-1",
          seller_id: SELLER_ID,
          total_price: 25,
          status: "CONFIRMED",
        },
        error: null,
      })
    );
    const response = await POST(makeRequest(), { params: { id: RENTAL_ID } });
    expect(response.status).toBe(400);
  });

  it("400 when amount in rappen is below Stripe minimum (50)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: SELLER_ID } } });
    mockFrom.mockReturnValue(
      rentalQueryChain({
        data: {
          id: RENTAL_ID,
          market_id: "m-1",
          seller_id: SELLER_ID,
          total_price: 0.4, // 40 rappen < 50
          status: "PENDING",
        },
        error: null,
      })
    );
    const response = await POST(makeRequest(), { params: { id: RENTAL_ID } });
    expect(response.status).toBe(400);
  });

  it("200 returns client_secret on happy path", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: SELLER_ID } } });
    mockFrom.mockReturnValue(
      rentalQueryChain({
        data: {
          id: RENTAL_ID,
          market_id: "m-1",
          seller_id: SELLER_ID,
          total_price: 25,
          status: "PENDING",
        },
        error: null,
      })
    );
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_test_123",
      client_secret: "pi_test_secret",
    });

    const response = await POST(makeRequest(), { params: { id: RENTAL_ID } });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.clientSecret).toBe("pi_test_secret");
    expect(body.paymentIntentId).toBe("pi_test_123");
    expect(body.amount).toBe(25);

    // Verify Stripe was called with correct metadata kind and rappen conversion.
    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2500,
        currency: "chf",
        metadata: expect.objectContaining({
          kind: "hanger_rental",
          rental_id: RENTAL_ID,
          seller_id: SELLER_ID,
        }),
      })
    );
  });

  it("500 when Stripe returns no client_secret", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: SELLER_ID } } });
    mockFrom.mockReturnValue(
      rentalQueryChain({
        data: {
          id: RENTAL_ID,
          market_id: "m-1",
          seller_id: SELLER_ID,
          total_price: 25,
          status: "PENDING",
        },
        error: null,
      })
    );
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_x",
      client_secret: null,
    });

    const response = await POST(makeRequest(), { params: { id: RENTAL_ID } });
    expect(response.status).toBe(500);
  });
});
