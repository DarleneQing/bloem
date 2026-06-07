import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockFrom, mockCookieSet } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockCookieSet: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: mockCookieSet,
    get: vi.fn(),
    delete: vi.fn(),
  }),
}));

const ORIGINAL_SECRET = process.env.INVITE_COOKIE_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.INVITE_COOKIE_SECRET =
    "test-secret-must-be-at-least-sixteen-chars";
});

import { validateInvite } from "./actions";

function buildSelectChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

describe("validateInvite", () => {
  it("rejects empty input", async () => {
    const result = await validateInvite({ code: "" });
    expect(result).toEqual({ error: "Invite code is required" });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("rejects unknown code", async () => {
    mockFrom.mockReturnValue(buildSelectChain({ data: null, error: null }));
    const result = await validateInvite({ code: "NOPE" });
    expect(result).toEqual({ error: "That invite code isn't valid." });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("rejects revoked code", async () => {
    mockFrom.mockReturnValue(
      buildSelectChain({
        data: { code: "OLD", revoked_at: "2026-01-01T00:00:00Z" },
        error: null,
      }),
    );
    const result = await validateInvite({ code: "OLD" });
    expect(result).toEqual({ error: "That invite code isn't valid." });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("returns DB-error message on lookup failure", async () => {
    mockFrom.mockReturnValue(
      buildSelectChain({ data: null, error: { message: "boom" } }),
    );
    const result = await validateInvite({ code: "ANY" });
    expect(result).toEqual({
      error: "Could not verify invite code. Please try again.",
    });
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("sets cookie and returns sign-up redirect by default on valid code", async () => {
    mockFrom.mockReturnValue(
      buildSelectChain({
        data: { code: "BLOEM2026", revoked_at: null },
        error: null,
      }),
    );
    const result = await validateInvite({ code: "BLOEM2026" });
    expect(result).toEqual({ redirectTo: "/auth/sign-up" });
    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    const call = mockCookieSet.mock.calls[0][0];
    expect(call.name).toBe("bloem_invite");
    expect(call.httpOnly).toBe(true);
    expect(call.sameSite).toBe("lax");
    expect(typeof call.value).toBe("string");
    expect(call.value).toContain(".");
  });

  it("returns a safe next redirect path when provided", async () => {
    mockFrom.mockReturnValue(
      buildSelectChain({
        data: { code: "BLOEM2026", revoked_at: null },
        error: null,
      }),
    );
    const result = await validateInvite({ code: "BLOEM2026" }, "/auth/sign-in");
    expect(result).toEqual({ redirectTo: "/auth/sign-in" });
  });

  it("ignores unsafe next paths", async () => {
    mockFrom.mockReturnValue(
      buildSelectChain({
        data: { code: "BLOEM2026", revoked_at: null },
        error: null,
      }),
    );
    const result = await validateInvite(
      { code: "BLOEM2026" },
      "//evil.example",
    );
    expect(result).toEqual({ redirectTo: "/auth/sign-up" });
  });

  it("trims whitespace before lookup", async () => {
    const chain = buildSelectChain({
      data: { code: "BLOEM2026", revoked_at: null },
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    await validateInvite({ code: "  BLOEM2026  " });
    const eqCall = chain.select.mock.results[0].value.eq.mock.calls[0];
    expect(eqCall[1]).toBe("BLOEM2026");
  });
});

afterEach(() => {
  process.env.INVITE_COOKIE_SECRET = ORIGINAL_SECRET;
});
