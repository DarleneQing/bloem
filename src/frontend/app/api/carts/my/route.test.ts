import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUserCart } = vi.hoisted(() => ({ mockGetUserCart: vi.fn() }));

vi.mock("@/features/carts/queries", () => ({
  getUserCart: mockGetUserCart,
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "./route";

function request() {
  return new Request("http://localhost/api/carts/my") as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/carts/my", () => {
  it("returns 200 with cart=null when there is no cart", async () => {
    mockGetUserCart.mockResolvedValue(null);
    const res = await GET(request());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cart).toBeNull();
  });

  it("returns 200 with cart payload when getUserCart resolves", async () => {
    mockGetUserCart.mockResolvedValue({
      cart: { id: "c-1" },
      total_items: 2,
      total_price: 50,
    });
    const res = await GET(request());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cart.cart.id).toBe("c-1");
    expect(body.cart.total_items).toBe(2);
  });

  it("returns 500 when getUserCart throws", async () => {
    mockGetUserCart.mockRejectedValue(new Error("db down"));
    const res = await GET(request());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.details).toContain("db down");
  });
});
