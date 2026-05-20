import type Stripe from "stripe";
import { syncProfile as syncMarketingAudience } from "@/lib/email/audiences";
import { createServiceClient } from "@/lib/supabase/service";

export async function syncStripeAccountToProfile(account: Stripe.Account) {
  const bloemUserId = account.metadata?.bloem_user_id;
  if (!bloemUserId) {
    return;
  }

  const supabase = createServiceClient();
  await supabase
    .from("profiles")
    .update({
      stripe_account_id: account.id,
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_details_submitted: account.details_submitted ?? false,
      stripe_requirements_due: account.requirements?.currently_due ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bloemUserId);

  // Stripe state change may shift the user's marketing segment
  // (e.g. buyer → pending_seller → verified_seller). Best-effort sync —
  // wrapped so any Resend / mock-chain error can't break webhook delivery.
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "email, first_name, last_name, role, stripe_account_id, stripe_payouts_enabled, marketing_consent, marketing_unsubscribe_token, suspended_at"
      )
      .eq("id", bloemUserId)
      .single();
    if (profile) {
      await syncMarketingAudience(profile);
    }
  } catch {
    // Swallow — the Stripe-side update already persisted.
  }
}
