import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateTimeRemaining,
  formatTimeRemaining,
  formatCountdownMmSs,
  getCartItemStatus,
  calculateCartTotal,
  calculatePlatformFee,
  hasExpiringItems,
  hasExpiredItems,
  filterActiveItems,
} from "./cart";
import type { EnrichedCartItem } from "@/types/carts";
import { EXPIRING_THRESHOLD_MS } from "@/types/carts";

function enriched(
  overrides: Partial<EnrichedCartItem> & { selling_price?: number | null } = {}
): EnrichedCartItem {
  const { selling_price, ...rest } = overrides;
  return {
    id: "ci-1",
    cart_id: "c-1",
    item_id: "i-1",
    reserved_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    reservation_count: 1,
    last_extended_at: null,
    auto_removed: false,
    created_at: new Date().toISOString(),
    status: "ACTIVE",
    time_remaining_ms: 60_000,
    can_extend: true,
    item: { id: "i-1", title: "x", selling_price: selling_price ?? 30 } as never,
    ...rest,
  } as EnrichedCartItem;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-20T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("calculateTimeRemaining", () => {
  it("returns positive ms for future expiry", () => {
    const future = new Date("2026-05-20T12:05:00Z").toISOString();
    expect(calculateTimeRemaining(future)).toBe(5 * 60_000);
  });

  it("returns 0 at exact expiry", () => {
    expect(calculateTimeRemaining("2026-05-20T12:00:00Z")).toBe(0);
  });

  it("returns negative ms when already expired", () => {
    const past = new Date("2026-05-20T11:55:00Z").toISOString();
    expect(calculateTimeRemaining(past)).toBe(-5 * 60_000);
  });
});

describe("formatTimeRemaining (cart timer)", () => {
  it.each([
    [0, "0:00"],
    [-1000, "0:00"],
    [60_000 + 5_000, "1:05"],
    [14 * 60_000 + 32_000, "14:32"],
    [60 * 60_000, "60:00"], // 1 hour
  ])("formats %dms → %s", (ms, expected) => {
    expect(formatTimeRemaining(ms)).toBe(expected);
  });
});

describe("formatCountdownMmSs (checkout badge — zero-pads minutes)", () => {
  it.each([
    [0, "00:00"],
    [-500, "00:00"],
    [5 * 1000, "00:05"],
    [60_000 + 5_000, "01:05"],
    [14 * 60_000 + 32_000, "14:32"],
  ])("formats %dms → %s", (ms, expected) => {
    expect(formatCountdownMmSs(ms)).toBe(expected);
  });
});

describe("getCartItemStatus", () => {
  it("EXPIRED for past expiry", () => {
    expect(getCartItemStatus("2026-05-20T11:00:00Z")).toBe("EXPIRED");
  });

  it("EXPIRING when within EXPIRING_THRESHOLD_MS", () => {
    const expires = new Date(Date.now() + EXPIRING_THRESHOLD_MS - 1000).toISOString();
    expect(getCartItemStatus(expires)).toBe("EXPIRING");
  });

  it("ACTIVE when comfortably in the future", () => {
    const expires = new Date(
      Date.now() + EXPIRING_THRESHOLD_MS + 60_000
    ).toISOString();
    expect(getCartItemStatus(expires)).toBe("ACTIVE");
  });
});

describe("calculateCartTotal", () => {
  it("sums seller prices", () => {
    expect(
      calculateCartTotal([
        enriched({ selling_price: 10 }),
        enriched({ selling_price: 25 }),
        enriched({ selling_price: 5 }),
      ])
    ).toBe(40);
  });

  it("treats null selling_price as 0 (doesn't crash)", () => {
    const e = enriched({ selling_price: null });
    e.item.selling_price = null as never;
    expect(calculateCartTotal([e])).toBe(0);
  });

  it("returns 0 for empty cart", () => {
    expect(calculateCartTotal([])).toBe(0);
  });
});

describe("calculatePlatformFee", () => {
  it("returns 10% of subtotal", () => {
    expect(calculatePlatformFee(100)).toBe(10);
    expect(calculatePlatformFee(50)).toBe(5);
    expect(calculatePlatformFee(0)).toBe(0);
  });

  it("matches the floating-point fee at 33.33", () => {
    expect(calculatePlatformFee(33.33)).toBeCloseTo(3.333, 3);
  });
});

describe("hasExpiringItems / hasExpiredItems", () => {
  it("hasExpiringItems true iff any item has status EXPIRING", () => {
    expect(
      hasExpiringItems([enriched({ status: "ACTIVE" }), enriched({ status: "EXPIRING" })])
    ).toBe(true);
    expect(hasExpiringItems([enriched({ status: "ACTIVE" })])).toBe(false);
  });

  it("hasExpiredItems true iff any item has status EXPIRED", () => {
    expect(
      hasExpiredItems([enriched({ status: "ACTIVE" }), enriched({ status: "EXPIRED" })])
    ).toBe(true);
    expect(hasExpiredItems([enriched({ status: "ACTIVE" })])).toBe(false);
  });
});

describe("filterActiveItems", () => {
  it("drops EXPIRED items, keeps ACTIVE and EXPIRING", () => {
    const items = [
      enriched({ status: "ACTIVE" }),
      enriched({ status: "EXPIRING" }),
      enriched({ status: "EXPIRED" }),
    ];
    const out = filterActiveItems(items);
    expect(out).toHaveLength(2);
    expect(out.every((i) => i.status !== "EXPIRED")).toBe(true);
  });

  it("returns empty array for empty input", () => {
    expect(filterActiveItems([])).toEqual([]);
  });
});
