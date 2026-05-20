import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockRpc, mockCheckRateLimit } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockRpc: vi.fn(),
  mockCheckRateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    rpc: mockRpc,
  })),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
  rateLimitHeaders: () => ({}),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from "./route";

const UUID = "11111111-1111-4111-8111-111111111111";
const USER = { id: "u-1" };

function rpcOk(payload: unknown) {
  // The route calls `.rpc(name, args).single<T>()`. Return a thenable-with-single
  // shape so both await patterns work.
  const result = { data: payload, error: null };
  return {
    single: vi.fn().mockResolvedValue(result),
    then: (onFulfilled: (v: typeof result) => unknown) =>
      Promise.resolve(onFulfilled(result)),
  };
}

function rpcErr(error: { message: string; code?: string }) {
  const result = { data: null, error };
  return {
    single: vi.fn().mockResolvedValue(result),
    then: (onFulfilled: (v: typeof result) => unknown) =>
      Promise.resolve(onFulfilled(result)),
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/carts/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: USER }, error: null });
  mockCheckRateLimit.mockResolvedValue({ success: true, disabled: true });
});

describe("POST /api/carts/items", () => {
  it("returns 400 when itemId is not a UUID", async () => {
    const res = await POST(request({ itemId: "not-a-uuid" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.details).toBeTruthy();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await POST(request({ itemId: UUID }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate-limited", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60_000,
    });
    const res = await POST(request({ itemId: UUID }));
    expect(res.status).toBe(429);
  });

  it("returns 201 with cart item on success", async () => {
    mockRpc.mockReturnValue(
      rpcOk({
        cart_item_id: "ci-1",
        cart_id: "c-1",
        item_id: UUID,
        expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
      })
    );
    const res = await POST(request({ itemId: UUID }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cartItem.id).toBe("ci-1");
    expect(body.expiresAt).toBeTruthy();
  });

  it("returns 409 for 'item_not_available:SOLD' RPC error", async () => {
    mockRpc.mockReturnValue(
      rpcErr({ message: "item_not_available:SOLD", code: "P0001" })
    );
    const res = await POST(request({ itemId: UUID }));
    expect(res.status).toBe(409);
  });

  it("returns 400 for 'cannot_reserve_own_item' RPC error", async () => {
    mockRpc.mockReturnValue(
      rpcErr({ message: "cannot_reserve_own_item", code: "P0001" })
    );
    const res = await POST(request({ itemId: UUID }));
    expect(res.status).toBe(400);
  });

  it("returns 404 for 'item_not_found' RPC error", async () => {
    mockRpc.mockReturnValue(rpcErr({ message: "item_not_found", code: "P0001" }));
    const res = await POST(request({ itemId: UUID }));
    expect(res.status).toBe(404);
  });

  it("returns 409 on unique-violation race (code 23505)", async () => {
    mockRpc.mockReturnValue(rpcErr({ message: "duplicate", code: "23505" }));
    const res = await POST(request({ itemId: UUID }));
    expect(res.status).toBe(409);
  });

  it("returns 500 when RPC returns no data and no error", async () => {
    mockRpc.mockReturnValue(rpcOk(null));
    const res = await POST(request({ itemId: UUID }));
    expect(res.status).toBe(500);
  });
});
