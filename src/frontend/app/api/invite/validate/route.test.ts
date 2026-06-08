import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: mockFrom }),
}));

import { GET, POST } from "./route";

const ORIGINAL_SECRET = process.env.INVITE_COOKIE_SECRET;

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/invite/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function buildSelectChain(result: { data: unknown; error: unknown }) {
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
  process.env.INVITE_COOKIE_SECRET =
    "test-secret-must-be-at-least-sixteen-chars";
});

afterEach(() => {
  process.env.INVITE_COOKIE_SECRET = ORIGINAL_SECRET;
});

describe("POST /api/invite/validate", () => {
  it("returns 405 for GET", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });

  it("returns 400 when code is missing", async () => {
    const res = await POST(postRequest({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invite code is required" });
  });

  it("returns 400 for invalid invite code", async () => {
    mockFrom.mockReturnValue(buildSelectChain({ data: null, error: null }));
    const res = await POST(postRequest({ code: "NOPE" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "That invite code isn't valid." });
  });

  it("returns 400 on downstream lookup error", async () => {
    mockFrom.mockReturnValue(
      buildSelectChain({ data: null, error: { message: "boom" } }),
    );
    const res = await POST(postRequest({ code: "ANY" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Could not verify invite code. Please try again.",
    });
  });

  it("sets invite cookie and returns redirect target on success", async () => {
    mockFrom.mockReturnValue(
      buildSelectChain({
        data: { code: "BLOEM2026", revoked_at: null },
        error: null,
      }),
    );
    const res = await POST(
      postRequest({ code: "BLOEM2026", next: "/auth/sign-in" }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "http://localhost/auth/sign-in",
    );

    const cookie = res.cookies.get("bloem_invite");
    expect(cookie?.value).toContain(".");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    expect(cookie?.path).toBe("/");
  });
});
