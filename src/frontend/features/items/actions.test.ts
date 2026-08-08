import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockFrom, mockInsert, mockUpdate } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { uploadItem, updateItem, markItemAsSold, extendReservation } from "./actions";

// PostgREST builders are chainable and awaitable; every method returns the same
// thenable so a call site can bolt on any number of .eq()/.gt()/.select() links.
function chain(result: unknown) {
  const builder: any = {
    eq: () => builder,
    gt: () => builder,
    select: () => builder,
    single: () => builder,
    maybeSingle: () => builder,
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

const USER_ID = "11111111-1111-1111-1111-111111111111";
const ITEM_ID = "22222222-2222-2222-2222-222222222222";

const BASE_ITEM_INPUT = {
  title: "Vintage jacket",
  category: "TOPS" as const,
  condition: "GOOD" as const,
  gender: "WOMEN" as const,
};

function mockProfileSelect(stripePayoutsEnabled: boolean) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { stripe_payouts_enabled: stripePayoutsEnabled },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === "items") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { owner_id: USER_ID, status: "WARDROBE" },
              error: null,
            }),
          }),
        }),
        insert: mockInsert,
        update: mockUpdate,
      };
    }

    return {};
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
  mockInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: ITEM_ID },
        error: null,
      }),
    }),
  });
  mockUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
});

describe("uploadItem seller gate", () => {
  it("rejects selling price from non-sellers", async () => {
    mockProfileSelect(false);

    const result = await uploadItem(
      { ...BASE_ITEM_INPUT, sellingPrice: 25 },
      ["https://example.com/1.jpg"],
      "https://example.com/thumb.jpg",
    );

    expect(result).toEqual({
      error: "You must be an active seller to set a selling price",
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("allows selling price for active sellers", async () => {
    mockProfileSelect(true);

    const result = await uploadItem(
      { ...BASE_ITEM_INPUT, sellingPrice: 25 },
      ["https://example.com/1.jpg"],
      "https://example.com/thumb.jpg",
    );

    expect(result).toEqual({ success: true, item: { id: ITEM_ID } });
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("updateItem seller gate", () => {
  it("rejects selling price from non-sellers", async () => {
    mockProfileSelect(false);

    const result = await updateItem(ITEM_ID, { sellingPrice: 30 });

    expect(result).toEqual({
      error: "You must be an active seller to set a selling price",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("allows selling price for active sellers", async () => {
    mockProfileSelect(true);

    const result = await updateItem(ITEM_ID, { sellingPrice: 30 });

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("uploadItem input validation", () => {
  it("returns the first Zod issue instead of throwing", async () => {
    const result = await uploadItem(
      { ...BASE_ITEM_INPUT, title: "ab" },
      ["https://example.com/1.jpg"],
      "https://example.com/thumb.jpg",
    );

    expect(result).toEqual({ error: "Title must be at least 3 characters" });
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("markItemAsSold status guard", () => {
  it("fails when the item left RACK before the update landed", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "items") {
        return {
          select: () => chain({ data: { owner_id: USER_ID, status: "RACK" }, error: null }),
          // 0 rows: the .eq("status","RACK") guard matched nothing.
          update: () => chain({ data: [], error: null }),
        };
      }
      return {};
    });

    const result = await markItemAsSold(ITEM_ID);

    expect(result).toEqual({
      error: "This item is no longer ready for sale — refresh the page and try again",
    });
  });
});

describe("extendReservation guarded update", () => {
  const CART_ITEM_ID = "33333333-3333-4333-8333-333333333333";

  it("fails when the reservation expired or was already extended", async () => {
    const reservedAt = new Date();
    const expiresAt = new Date(reservedAt.getTime() + 15 * 60 * 1000);

    mockFrom.mockImplementation((table: string) => {
      if (table === "cart_items") {
        return {
          select: () =>
            chain({
              data: {
                id: CART_ITEM_ID,
                cart_id: "cart-1",
                reserved_at: reservedAt.toISOString(),
                reservation_count: 1,
                expires_at: expiresAt.toISOString(),
                carts: { user_id: USER_ID },
              },
              error: null,
            }),
          // 0 rows: reservation_count moved or the row expired mid-flight.
          update: () => chain({ data: [], error: null }),
        };
      }
      return {};
    });

    const result = await extendReservation(CART_ITEM_ID);

    expect(result).toEqual({
      error: "Reservation expired or was already extended — refresh your cart",
    });
  });
});
