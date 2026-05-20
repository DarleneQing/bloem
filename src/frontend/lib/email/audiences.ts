import { resend } from "@/lib/email/resend";
import { logger } from "@/lib/logger";
import type { Profile } from "@/types/database";
import { computeSegment, type SegmentInput } from "./segments";

/**
 * Mirror of the bloem `profiles` row in Resend's Audience.
 *
 * Architecture: single Resend audience holds every consenting contact. The
 * `bloem_segment` Property carries which bloem segment they currently belong
 * to (buyer / pending_seller / verified_seller / admin). Resend Segments in
 * the dashboard filter on that property to drive broadcast targeting.
 *
 * Source of truth lives in Supabase. This module is a fire-and-forget
 * projection — any failure here MUST NOT bubble up to break account signup,
 * profile edits, or admin actions. Failures are logged and swallowed.
 */

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

function getAudienceId(): string | null {
  const value = process.env.RESEND_AUDIENCE_ID;
  return value && value.length > 0 ? value : null;
}

function buildPayload(profile: SyncProfileInput) {
  const segment = computeSegment(profile);
  const shouldBeSubscribed =
    profile.marketing_consent === true && profile.suspended_at === null;

  return {
    email: profile.email,
    firstName: profile.first_name ?? undefined,
    lastName: profile.last_name ?? undefined,
    unsubscribed: !shouldBeSubscribed,
    properties: {
      bloem_segment: segment,
      bloem_unsubscribe_token: profile.marketing_unsubscribe_token,
    },
  };
}

/**
 * Upsert a contact: create on first sight, update by email on every subsequent
 * call. We try create first because that's the typical first-sync path; if
 * the contact already exists Resend returns an error and we fall back to
 * update — also keyed by email so no contact-ID bookkeeping is needed.
 */
export async function syncProfile(profile: SyncProfileInput): Promise<void> {
  const audienceId = getAudienceId();
  if (!audienceId) return;

  const payload = buildPayload(profile);

  try {
    const created = await resend.contacts.create({ audienceId, ...payload });
    if (created.error) {
      // Most common error here is "Contact already exists" — switch to update.
      await updateExisting(audienceId, payload);
    }
  } catch (createError) {
    logger.error("[audiences] create threw, attempting update:", createError);
    await updateExisting(audienceId, payload);
  }
}

async function updateExisting(
  audienceId: string,
  payload: ReturnType<typeof buildPayload>
): Promise<void> {
  try {
    await resend.contacts.update({
      audienceId,
      email: payload.email,
      unsubscribed: payload.unsubscribed,
      firstName: payload.firstName,
      lastName: payload.lastName,
      properties: payload.properties,
    });
  } catch (updateError) {
    logger.error("[audiences] syncProfile update failed:", updateError);
  }
}

/**
 * Permanent removal from the audience (e.g. account deletion / GDPR erasure).
 * For voluntary unsubscribe, prefer `syncProfile` with `marketing_consent =
 * false` — that flips `unsubscribed = true` but preserves the contact record.
 */
export async function removeContact(email: string): Promise<void> {
  const audienceId = getAudienceId();
  if (!audienceId) return;

  try {
    await resend.contacts.remove({ audienceId, email });
  } catch (error) {
    logger.error("[audiences] removeContact failed:", error);
  }
}

// Exported for tests.
export const __internal = { getAudienceId, buildPayload };
