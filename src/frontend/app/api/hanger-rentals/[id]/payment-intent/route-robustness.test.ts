/**
 * Robustness tests for POST /api/hanger-rentals/[id]/payment-intent.
 *
 * Critical: the metadata on the PaymentIntent must contain ALL keys the
 * webhook handler (`fulfillHangerRental`) reads. If the route forgets to
 * set `rental_id`, the webhook silently no-ops and the rental never
 * confirms — the buyer paid for nothing.
 *
 * Currency is forced to "chf"; the conversion must use chfToStripeCents
 * exactly (no manual *100).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockFrom, mockPaymentIntentsCreate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockPaymentIntentsCreate: vi.fn(),
}));

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

import { POST } from "./route";

const RENTAL_ID = "11111111-1111-4111-8111-111111111111";
const SELLER = { id: "seller-1" };

function rentalSelectChain(result: { data: unknown; error: unknown }) {
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

function request() {
  return new Request("http://localhost/api/hanger-rentals/x/payment-intent", {
    method: "POST",
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: SELLER }, error: null });
});

describe("POST /api/hanger-rentals/[id]/payment-intent — metadata & currency", () => {
  it("PaymentIntent.metadata includes kind=hanger_rental + rental_id + seller_id + market_id", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({
        data: {
          id: RENTAL_ID,
          market_id: "market-1",
          seller_id: "seller-1",
          total_price: 25,
          status: "PENDING",
        },
        error: null,
      })
    );
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_1",
      client_secret: "pi_1_secret",
    });

    const res = await POST(request(), { params: { id: RENTAL_ID } });
    expect(res.status).toBe(200);

    expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
      amount: 2500, // 25 CHF * 100
      currency: "chf",
      metadata: {
        kind: "hanger_rental",
        rental_id: RENTAL_ID,
        market_id: "market-1",
        seller_id: "seller-1",
      },
    });
  });

  it("currency is always 'chf' (never reads any input)", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({
        data: {
          id: RENTAL_ID,
          market_id: "market-1",
          seller_id: "seller-1",
          total_price: 50,
          status: "PENDING",
        },
        error: null,
      })
    );
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_2",
      client_secret: "pi_2_secret",
    });

    await POST(request(), { params: { id: RENTAL_ID } });
    expect(mockPaymentIntentsCreate.mock.calls[0][0].currency).toBe("chf");
  });

  it("amount uses chfToStripeCents (rappen precision)", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({
        data: {
          id: RENTAL_ID,
          market_id: "market-1",
          seller_id: "seller-1",
          total_price: 12.34,
          status: "PENDING",
        },
        error: null,
      })
    );
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_3",
      client_secret: "pi_3_secret",
    });

    await POST(request(), { params: { id: RENTAL_ID } });
    expect(mockPaymentIntentsCreate.mock.calls[0][0].amount).toBe(1234);
  });

  it("returns 400 when amount falls below Stripe's CHF 0.50 floor (50 cents)", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({
        data: {
          id: RENTAL_ID,
          market_id: "market-1",
          seller_id: "seller-1",
          total_price: 0.49,
          status: "PENDING",
        },
        error: null,
      })
    );
    const res = await POST(request(), { params: { id: RENTAL_ID } });
    expect(res.status).toBe(400);
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.error).toMatch(/too low/i);
  });

  it("accepts the exact Stripe-CHF floor (50 cents = 0.50 CHF)", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({
        data: {
          id: RENTAL_ID,
          market_id: "market-1",
          seller_id: "seller-1",
          total_price: 0.5,
          status: "PENDING",
        },
        error: null,
      })
    );
    mockPaymentIntentsCreate.mockResolvedValue({
      id: "pi_floor",
      client_secret: "secret",
    });

    const res = await POST(request(), { params: { id: RENTAL_ID } });
    expect(res.status).toBe(200);
    expect(mockPaymentIntentsCreate.mock.calls[0][0].amount).toBe(50);
  });

  it("returns 404 when rental is not owned by the caller", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({ data: null, error: { message: "no rows" } })
    );
    const res = await POST(request(), { params: { id: RENTAL_ID } });
    expect(res.status).toBe(404);
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("returns 400 when rental status is not PENDING", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({
        data: {
          id: RENTAL_ID,
          market_id: "market-1",
          seller_id: "seller-1",
          total_price: 25,
          status: "CONFIRMED",
        },
        error: null,
      })
    );
    const res = await POST(request(), { params: { id: RENTAL_ID } });
    expect(res.status).toBe(400);
    expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when Stripe SDK throws (no money intent issued)", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({
        data: {
          id: RENTAL_ID,
          market_id: "market-1",
          seller_id: "seller-1",
          total_price: 25,
          status: "PENDING",
        },
        error: null,
      })
    );
    mockPaymentIntentsCreate.mockRejectedValue(new Error("Stripe is down"));
    const res = await POST(request(), { params: { id: RENTAL_ID } });
    expect(res.status).toBe(500);
  });

  it("returns 500 when Stripe response has no client_secret (defensive)", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({
        data: {
          id: RENTAL_ID,
          market_id: "market-1",
          seller_id: "seller-1",
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
    const res = await POST(request(), { params: { id: RENTAL_ID } });
    expect(res.status).toBe(500);
  });

  it("does NOT leak Stripe stack info containing secret material", async () => {
    mockFrom.mockReturnValue(
      rentalSelectChain({
        data: {
          id: RENTAL_ID,
          market_id: "market-1",
          seller_id: "seller-1",
          total_price: 25,
          status: "PENDING",
        },
        error: null,
      })
    );
    const err: Error & { stack?: string } = new Error("trace_with_secret");
    err.stack = "...sk_live_DO_NOT_LEAK...";
    mockPaymentIntentsCreate.mockRejectedValue(err);

    const res = await POST(request(), { params: { id: RENTAL_ID } });
    const body = await res.text();
    expect(body).not.toContain("sk_live_");
    expect(body).not.toContain("DO_NOT_LEAK");
  });
});
