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

import { uploadItem, updateItem, markItemAsSold } from "./actions";
import { chain } from "@/tests/helpers/postgrest-chain";

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
  function mockSoldFlow(updateResult: unknown, updateFilters: string[][], qrRow: unknown = null) {
    mockFrom.mockImplementation((table: string) => {
      if (table === "items") {
        return {
          select: () => chain({ data: { owner_id: USER_ID, status: "RACK" }, error: null }),
          update: () => chain(updateResult, updateFilters),
        };
      }
      if (table === "qr_codes") {
        return {
          select: () => chain({ data: qrRow, error: null }),
          update: () => chain({ data: qrRow ? [qrRow] : [], error: null }),
        };
      }
      return {};
    });
  }

  it("scopes the sold update to RACK items", async () => {
    const updateFilters: string[][] = [];
    mockSoldFlow({ data: [{ id: ITEM_ID }], error: null }, updateFilters);

    const result = await markItemAsSold(ITEM_ID);

    expect(result).toEqual({ success: true });
    expect(updateFilters).toContainEqual(["eq", "status", "RACK"]);
    expect(updateFilters).toContainEqual(["eq", "id", ITEM_ID]);
  });

  it("fails when the item left RACK before the update landed", async () => {
    // 0 rows: the .eq("status","RACK") guard matched nothing.
    mockSoldFlow({ data: [], error: null }, []);

    const result = await markItemAsSold(ITEM_ID);

    expect(result).toEqual({
      error: "This item is no longer ready for sale — refresh the page and try again",
    });
  });

  it("reports a QR tag it knows exists but could not claim", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "items") {
        return {
          select: () => chain({ data: { owner_id: USER_ID, status: "RACK" }, error: null }),
          update: () => chain({ data: [{ id: ITEM_ID }], error: null }),
        };
      }
      if (table === "qr_codes") {
        return {
          select: () => chain({ data: { id: "qr-1" }, error: null }),
          update: () => chain({ data: [], error: null }),
        };
      }
      return {};
    });

    const result = await markItemAsSold(ITEM_ID);

    expect(result).toEqual({
      error:
        "Item marked as sold, but its QR tag could not be updated. Refresh, and contact support if the tag still scans as available.",
    });
  });

  it("succeeds for a RACK item that never carried a QR tag", async () => {
    mockSoldFlow({ data: [{ id: ITEM_ID }], error: null }, [], null);

    const result = await markItemAsSold(ITEM_ID);

    expect(result).toEqual({ success: true });
  });
});
