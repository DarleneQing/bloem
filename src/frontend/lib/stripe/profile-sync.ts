import type Stripe from "stripe";
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
}
