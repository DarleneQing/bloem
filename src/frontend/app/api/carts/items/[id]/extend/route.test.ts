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
import { chain } from "@/tests/helpers/postgrest-chain";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const CART_ITEM_ID = "33333333-3333-4333-8333-333333333333";

function mockCartItem(updateResult: unknown, updateFilters: string[][] = []) {
  const reservedAt = new Date();
  const expiresAt = new Date(reservedAt.getTime() + 15 * 60 * 1000);

  mockFrom.mockImplementation(() => ({
    select: () =>
      chain({
        data: {
          id: CART_ITEM_ID,
          cart_id: "cart-1",
          item_id: "item-1",
          reserved_at: reservedAt.toISOString(),
          reservation_count: 1,
          expires_at: expiresAt.toISOString(),
          carts: { user_id: USER_ID },
        },
        error: null,
      }),
    update: () => chain(updateResult, updateFilters),
  }));
}

function request() {
  return new Request(`http://localhost/api/carts/items/${CART_ITEM_ID}/extend`, {
    method: "POST",
  }) as never;
}

const params = { params: { id: CART_ITEM_ID } };

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
});

describe("POST /api/carts/items/[id]/extend", () => {
  it("returns 401 when there is no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(request(), params);

    expect(res.status).toBe(401);
    expect((await res.json()).success).toBe(false);
  });

  it("extends the reservation on the happy path", async () => {
    mockCartItem({ data: [{ id: CART_ITEM_ID }], error: null });

    const res = await POST(request(), params);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.reservationCount).toBe(2);
    expect(body.newExpiresAt).toEqual(expect.any(String));
  });

  it("returns 409 when the guarded update matches no rows", async () => {
    const updateFilters: string[][] = [];
    // 0 rows: reservation_count moved or the row expired mid-flight.
    mockCartItem({ data: [], error: null }, updateFilters);

    const res = await POST(request(), params);

    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe(
      "Reservation expired or was already extended — refresh your cart"
    );
    expect(updateFilters).toContainEqual(["eq", "id", CART_ITEM_ID]);
    expect(updateFilters).toContainEqual(["eq", "reservation_count", "1"]);
    expect(updateFilters.some(([op, column]) => op === "gt" && column === "expires_at")).toBe(true);
  });
});
