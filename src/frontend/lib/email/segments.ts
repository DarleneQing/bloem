import type { Profile } from "@/types/database";

export type MarketingSegment =
  | "buyer"
  | "pending_seller"
  | "verified_seller"
  | "admin";

export const MARKETING_SEGMENTS: readonly MarketingSegment[] = [
  "buyer",
  "pending_seller",
  "verified_seller",
  "admin",
] as const;

/**
 * Minimum profile shape required to compute a segment. Kept narrow so callers
 * can pass partial selects (e.g. webhook handlers that only fetched the Stripe
 * fields) without needing a full profile row.
 */
export type SegmentInput = Pick<
  Profile,
  "role" | "stripe_account_id" | "stripe_payouts_enabled"
>;

/**
 * Project a profile into a single marketing segment.
 *
 * Precedence (highest → lowest):
 *   1. ADMIN role → "admin"
 *   2. Stripe payouts enabled → "verified_seller"
 *   3. Stripe onboarding started → "pending_seller"
 *   4. Default → "buyer"
 *
 * "Active seller" status is sourced from `stripe_payouts_enabled` to match the
 * canonical `is_active_seller(uuid)` SQL function (migration 044). Legacy
 * `iban_verified_at` is intentionally ignored.
 */
export function computeSegment(profile: SegmentInput): MarketingSegment {
  if (profile.role === "ADMIN") return "admin";
  if (profile.stripe_payouts_enabled) return "verified_seller";
  if (profile.stripe_account_id) return "pending_seller";
  return "buyer";
}
