import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAdminCreateUser,
  mockServiceFrom,
  mockSignInWithPassword,
  mockProfilesUpdate,
  mockReadInviteCookie,
  mockSyncMarketingAudience,
} = vi.hoisted(() => ({
  mockAdminCreateUser: vi.fn(),
  mockServiceFrom: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockProfilesUpdate: vi.fn(),
  mockReadInviteCookie: vi.fn(),
  mockSyncMarketingAudience: vi.fn(),
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

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((_url: string) => {
    throw new Error("REDIRECT");
  }),
}));

import { signUp } from "./actions";

const VALID_INPUT = {
  email: "ada@example.com",
  password: "Abcdef1!ghi",
  firstName: "Ada",
  lastName: "Lovelace",
  phone: "",
  address: "",
  marketingConsent: false,
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
});
