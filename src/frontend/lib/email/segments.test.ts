import { describe, expect, it } from "vitest";
import {
  MARKETING_SEGMENTS,
  computeSegment,
  type MarketingSegment,
  type SegmentInput,
} from "./segments";

function input(overrides: Partial<SegmentInput> = {}): SegmentInput {
  return {
    role: "USER",
    stripe_account_id: null,
    stripe_payouts_enabled: false,
    ...overrides,
  };
}

describe("computeSegment", () => {
  it("returns admin when role is ADMIN, regardless of Stripe state", () => {
    expect(computeSegment(input({ role: "ADMIN" }))).toBe("admin");
    expect(
      computeSegment(
        input({
          role: "ADMIN",
          stripe_account_id: "acct_123",
          stripe_payouts_enabled: true,
        })
      )
    ).toBe("admin");
  });

  it("returns verified_seller when payouts are enabled", () => {
    expect(
      computeSegment(
        input({ stripe_account_id: "acct_123", stripe_payouts_enabled: true })
      )
    ).toBe("verified_seller");
  });

  it("returns pending_seller when onboarding started but payouts not enabled", () => {
    expect(
      computeSegment(
        input({ stripe_account_id: "acct_123", stripe_payouts_enabled: false })
      )
    ).toBe("pending_seller");
  });

  it("returns buyer when no Stripe account exists", () => {
    expect(computeSegment(input())).toBe("buyer");
  });

  it("never confuses payouts_enabled without account_id (treats as verified)", () => {
    // Defensive: this shouldn't occur in production, but the rule must be deterministic.
    expect(
      computeSegment(
        input({ stripe_account_id: null, stripe_payouts_enabled: true })
      )
    ).toBe("verified_seller");
  });

  it("covers every documented segment from the matrix", () => {
    const cases: Array<{ input: SegmentInput; expected: MarketingSegment }> = [
      { input: input(), expected: "buyer" },
      {
        input: input({ stripe_account_id: "acct_1" }),
        expected: "pending_seller",
      },
      {
        input: input({
          stripe_account_id: "acct_1",
          stripe_payouts_enabled: true,
        }),
        expected: "verified_seller",
      },
      { input: input({ role: "ADMIN" }), expected: "admin" },
    ];

    for (const c of cases) {
      expect(computeSegment(c.input)).toBe(c.expected);
    }
  });

  it("MARKETING_SEGMENTS lists every possible return value exactly once", () => {
    expect(new Set(MARKETING_SEGMENTS).size).toBe(MARKETING_SEGMENTS.length);
    expect(MARKETING_SEGMENTS).toEqual([
      "buyer",
      "pending_seller",
      "verified_seller",
      "admin",
    ]);
  });
});
