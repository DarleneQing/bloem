import { describe, expect, it } from "vitest";
import {
  PLATFORM_FEE_RATE,
  MIN_PAYOUT_AMOUNT_CHF,
  computePurchaseFees,
  computeCartCheckoutTotal,
  chfToStripeCents,
  stripeCentsToChf,
} from "./fees";

// ----- money safety: edge cases at the extremes ----------------------------
//
// These tests exist because off-by-one rappen errors are real money in
// production. The Stripe rate is 10% — if computePurchaseFees ever drifts
// (e.g. PLATFORM_FEE_RATE changes by accident, rounding mode flips), a wide
// variety of these tests will fail loudly rather than silently overcharging
// sellers.

describe("computePurchaseFees — extremes", () => {
  it("zero-price item: no fee, no seller amount, no NaN", () => {
    const { totalAmount, platformFee, sellerAmount } = computePurchaseFees(0);
    expect(totalAmount).toBe(0);
    expect(platformFee).toBe(0);
    expect(sellerAmount).toBe(0);
    expect(Number.isFinite(platformFee)).toBe(true);
  });

  it("smallest payable amount (CHF 1) splits cleanly", () => {
    expect(computePurchaseFees(1)).toEqual({
      totalAmount: 1,
      platformFee: 0.1,
      sellerAmount: 0.9,
    });
  });

  it("dust amount (CHF 0.01 = 1 rappen) — platform fee floors to 0, seller gets full rappen", () => {
    // 0.01 * 0.1 = 0.001 → rounds to 0.00 → seller gets 0.01
    const { platformFee, sellerAmount, totalAmount } = computePurchaseFees(0.01);
    expect(totalAmount).toBe(0.01);
    expect(platformFee).toBe(0);
    expect(sellerAmount).toBe(0.01);
  });

  it("very large amount (CHF 10,000) computes without overflow", () => {
    expect(computePurchaseFees(10000)).toEqual({
      totalAmount: 10000,
      platformFee: 1000,
      sellerAmount: 9000,
    });
  });

  it("CHF 0.95 — verifies that `total = fee + seller` invariant survives rounding", () => {
    // 0.95 * 0.1 = 0.095 → 0.10. Seller = 0.95 - 0.10 = 0.85.
    const { totalAmount, platformFee, sellerAmount } = computePurchaseFees(0.95);
    expect(totalAmount).toBe(0.95);
    expect(platformFee).toBe(0.1);
    expect(sellerAmount).toBe(0.85);
    expect(platformFee + sellerAmount).toBeCloseTo(totalAmount, 2);
  });

  it("CHF 99.99 (common pricing) — fee = 10.00, seller = 89.99", () => {
    const { platformFee, sellerAmount } = computePurchaseFees(99.99);
    expect(platformFee).toBe(10);
    expect(sellerAmount).toBe(89.99);
  });

  it("does not accept negative input as a normal purchase (regression guard)", () => {
    // We don't reject — the function is pure math — but the result should be
    // arithmetically consistent so refund callers can rely on it.
    const { totalAmount, platformFee, sellerAmount } = computePurchaseFees(-50);
    expect(totalAmount).toBe(-50);
    expect(platformFee).toBe(-5);
    expect(sellerAmount).toBe(-45);
    expect(platformFee + sellerAmount).toBeCloseTo(totalAmount, 2);
  });

  it("invariant: platformFee = round(totalAmount * 0.10) for 200 random amounts", () => {
    for (let i = 0; i < 200; i++) {
      const amount = Math.round(Math.random() * 100_000) / 100; // 0..1000 CHF at 2dp
      const { totalAmount, platformFee, sellerAmount } = computePurchaseFees(amount);
      const expectedFee = Math.round(totalAmount * PLATFORM_FEE_RATE * 100) / 100;
      expect(platformFee).toBe(expectedFee);
      expect(Math.abs(totalAmount - (platformFee + sellerAmount))).toBeLessThanOrEqual(0.01);
    }
  });
});

describe("computeCartCheckoutTotal — extremes", () => {
  it("empty cart subtotal=0 → total=0", () => {
    expect(computeCartCheckoutTotal(0)).toBe(0);
  });

  it("multi-item subtotal CHF 33.33 → total CHF 36.66 (+3.33 fee)", () => {
    expect(computeCartCheckoutTotal(33.33)).toBe(36.66);
  });

  it("matches sum-of-purchases for a single item", () => {
    // For one item priced X, cart total == X + platformFee(X)
    for (const price of [12.5, 99.99, 250]) {
      const cart = computeCartCheckoutTotal(price);
      const { platformFee } = computePurchaseFees(price);
      expect(cart).toBe(Math.round((price + platformFee) * 100) / 100);
    }
  });

  it("very large cart (CHF 100,000) computes without precision drift", () => {
    expect(computeCartCheckoutTotal(100_000)).toBe(110_000);
  });
});

describe("chfToStripeCents / stripeCentsToChf — extremes", () => {
  it("never returns a non-integer (Stripe rejects float amounts)", () => {
    for (const chf of [0, 0.01, 0.005, 12.345, 99.999, 1000.5]) {
      const cents = chfToStripeCents(chf);
      expect(Number.isInteger(cents), `chfToStripeCents(${chf}) → ${cents}`).toBe(true);
    }
  });

  it("zero CHF maps to zero cents", () => {
    expect(chfToStripeCents(0)).toBe(0);
    expect(stripeCentsToChf(0)).toBe(0);
  });

  it("negative CHF (refunds) maps to negative cents", () => {
    expect(chfToStripeCents(-25)).toBe(-2500);
    expect(stripeCentsToChf(-2500)).toBe(-25);
  });

  it("ridiculous-amount round-trip stable (CHF 999,999.99)", () => {
    const big = 999_999.99;
    expect(stripeCentsToChf(chfToStripeCents(big))).toBe(big);
  });

  it("Math.round is half-up — 0.005 → 1, but 0.004 → 0", () => {
    expect(chfToStripeCents(0.005)).toBe(1);
    expect(chfToStripeCents(0.004)).toBe(0);
  });
});

describe("MIN_PAYOUT_AMOUNT_CHF — dust threshold", () => {
  it("is CHF 10 (matches admin payouts route gate)", () => {
    expect(MIN_PAYOUT_AMOUNT_CHF).toBe(10);
  });

  it("PLATFORM_FEE_RATE is 0.10 (regression: never drift without explicit migration)", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.1);
  });
});
