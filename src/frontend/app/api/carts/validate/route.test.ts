import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

import { POST } from "./route";

const USER_ID = "11111111-1111-1111-1111-111111111111";

function cartSelect(result: unknown) {
  return {
    select: () => ({
      eq: () => ({ single: () => Promise.resolve(result) }),
    }),
  };
}

function request() {
  return new Request("http://localhost/api/carts/validate", { method: "POST" }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
});

describe("POST /api/carts/validate", () => {
  it("returns 500 valid:false when the cart lookup fails", async () => {
    mockFrom.mockReturnValue(
      cartSelect({ data: null, error: { code: "08006", message: "connection failure" } })
    );

    const res = await POST(request());

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.valid).toBe(false);
  });

  it("still reports an empty cart as valid when there is genuinely no cart row", async () => {
    mockFrom.mockReturnValue(
      cartSelect({ data: null, error: { code: "PGRST116", message: "no rows" } })
    );

    const res = await POST(request());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.message).toBe("No cart found");
  });
});
