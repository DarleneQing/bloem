import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockFrom, mockSyncProfile } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockSyncProfile: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

vi.mock("@/lib/email/audiences", () => ({
  syncProfile: (...args: unknown[]) => mockSyncProfile(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateMarketingConsent } from "./actions";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const FROZEN_PROFILE = {
  email: "ada@example.com",
  first_name: "Ada",
  last_name: "Lovelace",
  role: "USER" as const,
  stripe_account_id: null,
  stripe_payouts_enabled: false,
  marketing_consent: true,
  marketing_unsubscribe_token: "tok-1",
  suspended_at: null,
};

function buildUpdateChain(result: { data: unknown; error: unknown }) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  mockSyncProfile.mockResolvedValue(undefined);
});

describe("updateMarketingConsent", () => {
  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await updateMarketingConsent({ consent: true });
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });

  it("returns error on invalid input", async () => {
    const result = await updateMarketingConsent({
      consent: "yes" as unknown as boolean,
    });
    expect(result).toEqual({ error: "Invalid input" });
  });

  it("persists consent=true, calls syncProfile, returns data discriminated union", async () => {
    mockFrom.mockReturnValue(
      buildUpdateChain({ data: FROZEN_PROFILE, error: null })
    );
    const result = await updateMarketingConsent({ consent: true });

    expect(result).toEqual({ data: { consent: true } });
    expect(mockSyncProfile).toHaveBeenCalledWith(FROZEN_PROFILE);

    const fromCall = mockFrom.mock.results[0].value;
    const updatePayload = fromCall.update.mock.calls[0][0];
    expect(updatePayload.marketing_consent).toBe(true);
    expect(typeof updatePayload.marketing_consent_updated_at).toBe("string");
  });

  it("persists consent=false and still calls syncProfile (to remove from audiences)", async () => {
    mockFrom.mockReturnValue(
      buildUpdateChain({
        data: { ...FROZEN_PROFILE, marketing_consent: false },
        error: null,
      })
    );
    const result = await updateMarketingConsent({ consent: false });

    expect(result).toEqual({ data: { consent: false } });
    expect(mockSyncProfile).toHaveBeenCalledTimes(1);
  });

  it("returns error when DB update fails", async () => {
    mockFrom.mockReturnValue(
      buildUpdateChain({ data: null, error: { message: "boom" } })
    );
    const result = await updateMarketingConsent({ consent: true });
    expect(result).toEqual({ error: "Failed to update preference" });
    expect(mockSyncProfile).not.toHaveBeenCalled();
  });
});
