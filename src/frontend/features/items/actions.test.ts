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

import { uploadItem, updateItem } from "./actions";

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
