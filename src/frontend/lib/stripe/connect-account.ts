import { getStripe } from "@/lib/stripe/server";

interface CreateConnectedAccountInput {
  userId: string;
  email: string;
  displayName?: string;
}

/**
 * Connect Accounts v2 — recipient + Express dashboard for separate-charges-and-transfers.
 * @see https://docs.stripe.com/connect/accounts-v2
 */
export async function createStripeConnectedAccount(input: CreateConnectedAccountInput) {
  const stripe = getStripe();

  const account = await stripe.v2.core.accounts.create({
    contact_email: input.email,
    display_name: input.displayName?.trim() || input.email,
    dashboard: "express",
    identity: {
      country: "ch",
      entity_type: "individual",
    },
    configuration: {
      recipient: {
        capabilities: {
          stripe_balance: {
            stripe_transfers: { requested: true },
          },
        },
      },
    },
    defaults: {
      currency: "chf",
      responsibilities: {
        fees_collector: "application",
        losses_collector: "application",
      },
    },
    metadata: {
      bloem_user_id: input.userId,
    },
  });

  return account;
}
