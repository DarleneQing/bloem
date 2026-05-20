import { resend } from "@/lib/email/resend";
import { logger } from "@/lib/logger";
import type { Profile } from "@/types/database";
import {
  MARKETING_SEGMENTS,
  computeSegment,
  type MarketingSegment,
  type SegmentInput,
} from "./segments";

/**
 * Mirror of the bloem `profiles` row in Resend's Audiences API.
 *
 * Source of truth lives in Supabase. This module is a fire-and-forget
 * projection — any failure here MUST NOT bubble up to break account signup,
 * profile edits, or admin actions. Failures are logged and swallowed.
 */

export type AudienceContactInput = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  unsubscribeToken: string;
};

export type SyncProfileInput = SegmentInput &
  Pick<
    Profile,
    | "email"
    | "first_name"
    | "last_name"
    | "marketing_consent"
    | "marketing_unsubscribe_token"
    | "suspended_at"
  >;

const ENV_VAR_BY_SEGMENT: Record<MarketingSegment, string> = {
  buyer: "RESEND_AUDIENCE_ID_BUYER",
  pending_seller: "RESEND_AUDIENCE_ID_PENDING_SELLER",
  verified_seller: "RESEND_AUDIENCE_ID_VERIFIED_SELLER",
  admin: "RESEND_AUDIENCE_ID_ADMIN",
};

function getAudienceId(segment: MarketingSegment): string | null {
  const value = process.env[ENV_VAR_BY_SEGMENT[segment]];
  return value && value.length > 0 ? value : null;
}

/**
 * Find a contact by email inside one audience. Returns `null` when absent or
 * when the Resend SDK errors. The SDK's `list` endpoint is paginated; for the
 * small audience sizes bloem will have pre-launch this single call is fine.
 */
async function findContactId(
  audienceId: string,
  email: string
): Promise<string | null> {
  try {
    const result = await resend.contacts.list({ audienceId });
    const contacts = result.data?.data ?? [];
    const lowered = email.toLowerCase();
    const found = contacts.find((c) => c.email.toLowerCase() === lowered);
    return found?.id ?? null;
  } catch (error) {
    logger.error("[audiences] findContactId failed:", error);
    return null;
  }
}

export async function addContact(
  segment: MarketingSegment,
  contact: AudienceContactInput
): Promise<void> {
  const audienceId = getAudienceId(segment);
  if (!audienceId) return;

  try {
    await resend.contacts.create({
      audienceId,
      email: contact.email,
      firstName: contact.firstName ?? undefined,
      lastName: contact.lastName ?? undefined,
      unsubscribed: false,
    });
  } catch (error) {
    logger.error(`[audiences] addContact(${segment}) failed:`, error);
  }
}

export async function removeContact(
  segment: MarketingSegment,
  email: string
): Promise<void> {
  const audienceId = getAudienceId(segment);
  if (!audienceId) return;

  try {
    await resend.contacts.remove({ audienceId, email });
  } catch (error) {
    logger.error(`[audiences] removeContact(${segment}) failed:`, error);
  }
}

/**
 * Reconcile a profile with its Resend audiences:
 *   - Suspended or unconsented → remove from every audience.
 *   - Consented → ensure present in the current segment, absent from all others.
 *
 * Idempotent: safe to call repeatedly. The naive "remove from all, add to one"
 * approach is intentional — audience sizes pre-launch are small and we'd
 * rather pay a few extra API calls than maintain client-side state about
 * which audience a contact is currently in.
 */
export async function syncProfile(profile: SyncProfileInput): Promise<void> {
  const shouldBeSubscribed =
    profile.marketing_consent === true && profile.suspended_at === null;

  if (!shouldBeSubscribed) {
    await Promise.all(
      MARKETING_SEGMENTS.map((s) => removeContact(s, profile.email))
    );
    return;
  }

  const targetSegment = computeSegment(profile);
  const others = MARKETING_SEGMENTS.filter((s) => s !== targetSegment);

  await Promise.all(others.map((s) => removeContact(s, profile.email)));

  await addContact(targetSegment, {
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    unsubscribeToken: profile.marketing_unsubscribe_token,
  });
}

// Exported for tests; not part of the public API.
export const __internal = { getAudienceId, findContactId, ENV_VAR_BY_SEGMENT };
