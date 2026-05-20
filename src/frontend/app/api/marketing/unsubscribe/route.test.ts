import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFrom, mockSyncProfile, mockCheckRateLimit } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSyncProfile: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/email/audiences", () => ({
  syncProfile: (...args: unknown[]) => mockSyncProfile(...args),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  rateLimitHeaders: () => ({}),
}));

import { GET } from "./route";

const VALID_TOKEN = "11111111-1111-4111-8111-111111111111";
const PROFILE_BASE = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "ada@example.com",
  first_name: "Ada",
  last_name: "Lovelace",
  role: "USER" as const,
  stripe_account_id: null,
  stripe_payouts_enabled: false,
  marketing_consent: true,
  marketing_unsubscribe_token: VALID_TOKEN,
  suspended_at: null,
};

function buildLookupChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  };
}

function buildLookupAndUpdateChain(opts: {
  lookup: { data: unknown; error: unknown };
  updateError?: unknown;
}) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(opts.lookup),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
    }),
  };
}

function request(url: string, ip = "1.2.3.4") {
  return new Request(url, {
    method: "GET",
    headers: { "x-forwarded-for": ip },
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockResolvedValue({
    success: true,
    limit: 20,
    remaining: 19,
    reset: 0,
    disabled: false,
  });
  mockSyncProfile.mockResolvedValue(undefined);
});

describe("GET /api/marketing/unsubscribe", () => {
  it("returns 429 when rate-limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      limit: 20,
      remaining: 0,
      reset: 0,
      disabled: false,
    });
    const res = await GET(
      request(`http://localhost/api/marketing/unsubscribe?token=${VALID_TOKEN}`)
    );
    expect(res.status).toBe(429);
  });

  it("returns 404 when token is missing", async () => {
    const res = await GET(request("http://localhost/api/marketing/unsubscribe"));
    expect(res.status).toBe(404);
  });

  it("returns 404 when token is not a UUID", async () => {
    const res = await GET(
      request("http://localhost/api/marketing/unsubscribe?token=not-a-uuid")
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when token does not match any profile", async () => {
    mockFrom.mockReturnValue(buildLookupChain({ data: null, error: null }));
    const res = await GET(
      request(`http://localhost/api/marketing/unsubscribe?token=${VALID_TOKEN}`)
    );
    expect(res.status).toBe(404);
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });

  it("returns 200 idempotent message when already unsubscribed", async () => {
    mockFrom.mockReturnValue(
      buildLookupChain({
        data: { ...PROFILE_BASE, marketing_consent: false },
        error: null,
      })
    );
    const res = await GET(
      request(`http://localhost/api/marketing/unsubscribe?token=${VALID_TOKEN}`)
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/already unsubscribed/i);
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });

  it("flips consent to false and calls syncProfile on success", async () => {
    mockFrom.mockReturnValue(
      buildLookupAndUpdateChain({ lookup: { data: PROFILE_BASE, error: null } })
    );
    const res = await GET(
      request(`http://localhost/api/marketing/unsubscribe?token=${VALID_TOKEN}`)
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/unsubscribed/i);
    expect(mockSyncProfile).toHaveBeenCalledTimes(1);
    expect(mockSyncProfile).toHaveBeenCalledWith(
      expect.objectContaining({ marketing_consent: false })
    );
  });

  it("returns 500 when DB update errors", async () => {
    mockFrom.mockReturnValue(
      buildLookupAndUpdateChain({
        lookup: { data: PROFILE_BASE, error: null },
        updateError: { message: "boom" },
      })
    );
    const res = await GET(
      request(`http://localhost/api/marketing/unsubscribe?token=${VALID_TOKEN}`)
    );
    expect(res.status).toBe(500);
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });
});
