import { describe, expect, it } from "vitest";
import {
  buildCartCheckoutIdempotencyKey,
  buildCartCheckoutLineItems,
  computeCartCheckoutTotalFromItems,
} from "./cart-checkout-session";

describe("buildCartCheckoutLineItems", () => {
  it("creates one line per item", () => {
    const lines = buildCartCheckoutLineItems([
      { itemId: "a", title: "Vintage jacket", sellingPrice: 50 },
      { itemId: "b", title: "Silk scarf", sellingPrice: 30 },
    ]);

    expect(lines).toHaveLength(2);
    expect(lines[0]?.price_data?.product_data?.name).toBe("Vintage jacket");
    expect(lines[0]?.price_data?.unit_amount).toBe(5000);
    expect(lines[1]?.price_data?.product_data?.name).toBe("Silk scarf");
    expect(lines[1]?.price_data?.unit_amount).toBe(3000);
  });

  it("uses a fallback name when title is blank", () => {
    const lines = buildCartCheckoutLineItems([
      { itemId: "a", title: "   ", sellingPrice: 10 },
    ]);

    expect(lines[0]?.price_data?.product_data?.name).toBe("Item");
  });
});

describe("buildCartCheckoutIdempotencyKey", () => {
  it("includes cart snapshot and session API version", () => {
    const key = buildCartCheckoutIdempotencyKey(
      "cart-1",
      "2026-05-19T12:00:00Z",
      11000,
      "item-a,item-b"
    );

    expect(key).toContain("elements-v2");
    expect(key).toContain("cart-1");
    expect(key).toContain("11000");
    expect(key).toContain("item-a,item-b");
  });
});

describe("computeCartCheckoutTotalFromItems", () => {
  it("sums item prices for checkout total", () => {
    expect(
      computeCartCheckoutTotalFromItems([
        { itemId: "a", title: "Item", sellingPrice: 100 },
      ])
    ).toBe(100);
  });
});
