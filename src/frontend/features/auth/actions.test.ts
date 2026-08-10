import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAdminCreateUser,
  mockServiceFrom,
  mockSignInWithPassword,
  mockProfilesUpdate,
  mockReadInviteCookie,
  mockSyncMarketingAudience,
  mockCheckRateLimit,
} = vi.hoisted(() => ({
  mockAdminCreateUser: vi.fn(),
  mockServiceFrom: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockProfilesUpdate: vi.fn(),
  mockReadInviteCookie: vi.fn(),
  mockSyncMarketingAudience: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    auth: { admin: { createUser: mockAdminCreateUser } },
    from: mockServiceFrom,
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword: mockSignInWithPassword },
    from: vi.fn(() => ({
      update: mockProfilesUpdate,
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));

vi.mock("@/lib/invite/cookie", () => ({
  readInviteCookie: mockReadInviteCookie,
}));

vi.mock("@/lib/email/audiences", () => ({
  syncProfile: mockSyncMarketingAudience,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((_url: string) => {
    throw new Error("REDIRECT");
  }),
}));

import { signUp, signInWithEmail, resetPassword, updateIBAN } from "./actions";

const VALID_INPUT = {
  email: "ada@example.com",
  password: "Abcdef1!ghi",
  firstName: "Ada",
  lastName: "Lovelace",
  phone: "",
  address: "",
  marketingConsent: false,
};

const SIGN_IN_INPUT = {
  email: "ada@example.com",
  password: "Abcdef1!ghi",
};

const RATE_LIMIT_EXCEEDED = {
  success: false,
  limit: 5,
  remaining: 0,
  reset: Date.now() + 1000,
  disabled: false,
};

const RATE_LIMIT_ALLOWED = {
  success: true,
  limit: 0,
  remaining: 0,
  reset: 0,
  disabled: true,
};

function buildInviteSelectChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockProfilesUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  mockCheckRateLimit.mockResolvedValue(RATE_LIMIT_ALLOWED);
});

describe("signUp invite gate", () => {
  it("returns error when invite cookie is missing", async () => {
    mockReadInviteCookie.mockResolvedValue(null);
    const result = await signUp(VALID_INPUT);
    expect(result).toEqual({ error: "Invite required" });
    expect(mockAdminCreateUser).not.toHaveBeenCalled();
  });

  it("returns error when invite code is revoked", async () => {
    mockReadInviteCookie.mockResolvedValue({
      code: "OLD",
      exp: Date.now() + 10_000,
    });
    mockServiceFrom.mockReturnValue(
      buildInviteSelectChain({
        data: { code: "OLD", revoked_at: "2026-01-01T00:00:00Z" },
        error: null,
      }),
    );
    const result = await signUp(VALID_INPUT);
    expect(result).toEqual({ error: "Invite code is no longer valid" });
    expect(mockAdminCreateUser).not.toHaveBeenCalled();
  });

  it("returns error when invite code no longer exists", async () => {
    mockReadInviteCookie.mockResolvedValue({
      code: "GHOST",
      exp: Date.now() + 10_000,
    });
    mockServiceFrom.mockReturnValue(
      buildInviteSelectChain({ data: null, error: null }),
    );
    const result = await signUp(VALID_INPUT);
    expect(result).toEqual({ error: "Invite code is no longer valid" });
    expect(mockAdminCreateUser).not.toHaveBeenCalled();
  });

  it("creates user via service-role admin API when invite is valid", async () => {
    mockReadInviteCookie.mockResolvedValue({
      code: "BLOEM2026",
      exp: Date.now() + 10_000,
    });
    mockServiceFrom.mockReturnValue(
      buildInviteSelectChain({
        data: { code: "BLOEM2026", revoked_at: null },
        error: null,
      }),
    );
    mockAdminCreateUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "tok" } },
      error: null,
    });

    // signUp ends in a redirect() which we mocked to throw — catch it.
    await expect(signUp(VALID_INPUT)).rejects.toThrow("REDIRECT");

    expect(mockAdminCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ada@example.com",
        password: "Abcdef1!ghi",
        email_confirm: true,
        user_metadata: { first_name: "Ada", last_name: "Lovelace" },
      }),
    );
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "Abcdef1!ghi",
    });
  });

  it("returns error when admin.createUser fails", async () => {
    mockReadInviteCookie.mockResolvedValue({
      code: "BLOEM2026",
      exp: Date.now() + 10_000,
    });
    mockServiceFrom.mockReturnValue(
      buildInviteSelectChain({
        data: { code: "BLOEM2026", revoked_at: null },
        error: null,
      }),
    );
    mockAdminCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "email already exists" },
    });

    const result = await signUp(VALID_INPUT);
    expect(result).toEqual({ error: "email already exists" });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("returns error when rate limit is exceeded, before touching the invite gate", async () => {
    mockCheckRateLimit.mockResolvedValue(RATE_LIMIT_EXCEEDED);

    const result = await signUp(VALID_INPUT);
    expect(result).toEqual({ error: "Too many attempts. Please try again later." });
    expect(mockReadInviteCookie).not.toHaveBeenCalled();
    expect(mockAdminCreateUser).not.toHaveBeenCalled();
  });
});

describe("signInWithEmail", () => {
  it("returns error without signing in when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue(RATE_LIMIT_EXCEEDED);

    const result = await signInWithEmail(SIGN_IN_INPUT);
    expect(result).toEqual({ error: "Too many attempts. Please try again later." });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("returns a validation error for an invalid email without throwing", async () => {
    const result = await signInWithEmail({ ...SIGN_IN_INPUT, email: "not-an-email" });
    expect(result).toEqual({ error: expect.any(String) });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("signs in when the rate limit allows the request", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    await expect(signInWithEmail(SIGN_IN_INPUT)).rejects.toThrow("REDIRECT");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: SIGN_IN_INPUT.email,
      password: SIGN_IN_INPUT.password,
    });
  });
});

describe("resetPassword", () => {
  it("returns error without sending the reset email when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockResolvedValue(RATE_LIMIT_EXCEEDED);

    const result = await resetPassword("ada@example.com");
    expect(result).toEqual({ error: "Too many attempts. Please try again later." });
  });

  it("returns a validation error for an invalid email without throwing", async () => {
    const result = await resetPassword("not-an-email");
    expect(result).toEqual({ error: expect.any(String) });
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
  });
});

describe("updateIBAN", () => {
  it("returns a validation error for a malformed IBAN without throwing", async () => {
    const result = await updateIBAN({
      iban: "not-an-iban",
      bankName: "Test Bank",
      accountHolderName: "Ada Lovelace",
    });
    expect(result).toEqual({ error: expect.any(String) });
  });
});
