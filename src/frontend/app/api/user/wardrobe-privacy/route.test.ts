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

import { PUT } from "./route";

function buildUpdateChain(error: unknown = null) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error }),
    }),
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/user/wardrobe-privacy", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null });
});

describe("PUT /api/user/wardrobe-privacy", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await PUT(request({ public: true }));
    expect(res.status).toBe(401);
  });

  it("returns non-2xx for invalid body shape", async () => {
    const res = await PUT(request({ public: "yes-please" }));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("returns 200 with wardrobePublic=true on successful enable", async () => {
    mockFrom.mockReturnValue(buildUpdateChain(null));
    const res = await PUT(request({ public: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.wardrobePublic).toBe(true);
  });

  it("returns 200 with wardrobePublic=false on successful disable", async () => {
    mockFrom.mockReturnValue(buildUpdateChain(null));
    const res = await PUT(request({ public: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wardrobePublic).toBe(false);
  });

  it("returns 500 on DB update error", async () => {
    mockFrom.mockReturnValue(buildUpdateChain({ message: "constraint violation" }));
    const res = await PUT(request({ public: true }));
    expect(res.status).toBe(500);
  });
});
