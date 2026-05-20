import { describe, expect, it } from "vitest";
import {
  buildCartCheckoutLineItems,
  computeCartCheckoutTotalFromItems,
  buildCartCheckoutIdempotencyKey,
  type CartCheckoutLineItemInput,
} from "./cart-checkout-session";

const SAMPLE: CartCheckoutLineItemInput[] = [
  { itemId: "i-1", title: "Wool Coat", sellingPrice: 75 },
  { itemId: "i-2", title: "Silk Blouse", sellingPrice: 50 },
  { itemId: "i-3", title: "Denim Jeans", sellingPrice: 25 },
];

describe("buildCartCheckoutLineItems", () => {
  it("creates one line per item with quantity=1", () => {
    const lines = buildCartCheckoutLineItems(SAMPLE);
    expect(lines).toHaveLength(3);
    expect(lines.every((l) => l.quantity === 1)).toBe(true);
  });

  it("currency is always CHF", () => {
    const lines = buildCartCheckoutLineItems(SAMPLE);
    expect(lines.every((l) => l.price_data.currency === "chf")).toBe(true);
  });

  it("converts price to rappen (Stripe cents)", () => {
    const lines = buildCartCheckoutLineItems([
      { itemId: "x", title: "Test", sellingPrice: 12.5 },
    ]);
    expect(lines[0]?.price_data.unit_amount).toBe(1250);
  });

  it("trims whitespace from title and falls back to 'Item' for empty", () => {
    const lines = buildCartCheckoutLineItems([
      { itemId: "x", title: "  Padded  ", sellingPrice: 10 },
      { itemId: "y", title: "   ", sellingPrice: 10 },
      { itemId: "z", title: "", sellingPrice: 10 },
    ]);
    expect(lines[0]?.price_data.product_data.name).toBe("Padded");
    expect(lines[1]?.price_data.product_data.name).toBe("Item");
    expect(lines[2]?.price_data.product_data.name).toBe("Item");
  });

  it("returns an empty array for empty input", () => {
    expect(buildCartCheckoutLineItems([])).toEqual([]);
  });
});

describe("computeCartCheckoutTotalFromItems", () => {
  it("sums prices to 2dp", () => {
    expect(computeCartCheckoutTotalFromItems(SAMPLE)).toBe(150);
  });

  it("handles floating-point rounding (no .0000001 results)", () => {
    expect(
      computeCartCheckoutTotalFromItems([
        { itemId: "a", title: "x", sellingPrice: 0.1 },
        { itemId: "b", title: "y", sellingPrice: 0.2 },
      ])
    ).toBe(0.3);
  });

  it("returns 0 for empty cart", () => {
    expect(computeCartCheckoutTotalFromItems([])).toBe(0);
  });
});

describe("buildCartCheckoutIdempotencyKey", () => {
  it("includes cart_id + amountCents + version tag", () => {
    const key = buildCartCheckoutIdempotencyKey(
      "cart-1",
      "2026-05-20T10:00:00Z",
      15000,
      "i-1,i-2"
    );
    expect(key).toContain("cart-checkout-elements-v2-cart-1");
    expect(key).toContain("15000");
    expect(key).toContain("i-1,i-2");
  });

  it("differs when cart_updated_at changes (so re-adding items invalidates the key)", () => {
    const k1 = buildCartCheckoutIdempotencyKey("c", "T1", 100, "a");
    const k2 = buildCartCheckoutIdempotencyKey("c", "T2", 100, "a");
    expect(k1).not.toBe(k2);
  });

  it("differs when item ID list changes", () => {
    const k1 = buildCartCheckoutIdempotencyKey("c", "T", 100, "a");
    const k2 = buildCartCheckoutIdempotencyKey("c", "T", 100, "b");
    expect(k1).not.toBe(k2);
  });
});
