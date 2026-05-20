import { describe, expect, it } from "vitest";
import {
  PLATFORM_FEE_RATE,
  MIN_PAYOUT_AMOUNT_CHF,
  computePurchaseFees,
  computeCartCheckoutTotal,
  chfToStripeCents,
  stripeCentsToChf,
} from "./fees";

describe("fees constants", () => {
  it("PLATFORM_FEE_RATE is 10%", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.1);
  });

  it("MIN_PAYOUT_AMOUNT_CHF is 10 CHF", () => {
    expect(MIN_PAYOUT_AMOUNT_CHF).toBe(10);
  });
});

describe("computePurchaseFees", () => {
  it("splits a CHF 100 purchase into 10 fee + 90 seller", () => {
    expect(computePurchaseFees(100)).toEqual({
      totalAmount: 100,
      platformFee: 10,
      sellerAmount: 90,
    });
  });

  it("rounds rappen (0.01 CHF)", () => {
    expect(computePurchaseFees(33.33)).toEqual({
      totalAmount: 33.33,
      platformFee: 3.33,
      sellerAmount: 30,
    });
  });

  it("handles a 0 purchase without dividing by zero", () => {
    expect(computePurchaseFees(0)).toEqual({
      totalAmount: 0,
      platformFee: 0,
      sellerAmount: 0,
    });
  });

  it("totalAmount = platformFee + sellerAmount for arbitrary input", () => {
    const inputs = [0.5, 1, 12.99, 49.95, 199.99, 1234.56];
    for (const price of inputs) {
      const { totalAmount, platformFee, sellerAmount } = computePurchaseFees(price);
      // Allow 1 rappen rounding wobble — fees are floored to 2dp.
      expect(Math.abs(totalAmount - (platformFee + sellerAmount))).toBeLessThanOrEqual(0.01);
    }
  });
});

describe("computeCartCheckoutTotal", () => {
  it("adds 10% on top of subtotal", () => {
    expect(computeCartCheckoutTotal(100)).toBe(110);
    expect(computeCartCheckoutTotal(50)).toBe(55);
  });

  it("rounds to 2dp", () => {
    expect(computeCartCheckoutTotal(33.33)).toBeCloseTo(36.66, 2);
  });

  it("returns 0 for empty cart", () => {
    expect(computeCartCheckoutTotal(0)).toBe(0);
  });
});

describe("chfToStripeCents / stripeCentsToChf", () => {
  it("converts CHF to rappen (Stripe cents)", () => {
    expect(chfToStripeCents(1)).toBe(100);
    expect(chfToStripeCents(0.05)).toBe(5);
    expect(chfToStripeCents(123.45)).toBe(12345);
  });

  it("converts rappen back to CHF", () => {
    expect(stripeCentsToChf(100)).toBe(1);
    expect(stripeCentsToChf(12345)).toBe(123.45);
    expect(stripeCentsToChf(0)).toBe(0);
  });

  it("roundtrip is stable for 2dp CHF amounts", () => {
    for (const amount of [0.01, 0.99, 1, 12.5, 99.99, 1000]) {
      expect(stripeCentsToChf(chfToStripeCents(amount))).toBe(amount);
    }
  });

  it("rounds half-cent inputs to nearest cent (banker-safe via Math.round)", () => {
    // 0.005 CHF → 0.5 cents → rounds to 1 cent
    expect(chfToStripeCents(0.005)).toBe(1);
  });
});
