"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { syncProfile as syncMarketingAudience } from "@/lib/email/audiences";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const updateConsentSchema = z.object({
  consent: z.boolean(),
});

export type UpdateMarketingConsentInput = z.infer<typeof updateConsentSchema>;

/**
 * Toggle the caller's marketing-email consent.
 *
 * - Stamps `marketing_consent_updated_at` so the GDPR audit trail is intact.
 * - Pushes the change into Resend audiences (failure swallowed in the
 *   audiences wrapper; never blocks the user's preference from saving).
 * - Returns the canonical bloem Server Action discriminated union.
 */
export async function updateMarketingConsent(
  input: UpdateMarketingConsentInput
) {
  const parsed = updateConsentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input" } as const;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      marketing_consent: parsed.data.consent,
      marketing_consent_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select(
      "email, first_name, last_name, role, stripe_account_id, stripe_payouts_enabled, marketing_consent, marketing_unsubscribe_token, suspended_at"
    )
    .single();

  if (error || !updated) {
    logger.error(
      "[marketing] updateMarketingConsent failed to persist:",
      error
    );
    return { error: "Failed to update preference" } as const;
  }

  await syncMarketingAudience(updated);

  revalidatePath("/profile");

  return { data: { consent: parsed.data.consent } } as const;
}
