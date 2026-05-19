"use client";

import { useState } from "react";
import {
  createStripeOnboardingLink,
  refreshStripeAccountStatus,
} from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import type { ProfileWithStatus } from "@/types/database";

interface StripeSellerOnboardingProps {
  profile: ProfileWithStatus;
  embedded?: boolean;
}

export function StripeSellerOnboarding({
  profile,
  embedded = false,
}: StripeSellerOnboardingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stripeDetailsSubmitted = profile.stripe_details_submitted ?? false;
  const stripePayoutsEnabled = profile.stripe_payouts_enabled ?? false;

  const openStripeAccount = async () => {
    setLoading(true);
    setError(null);
    const result = await createStripeOnboardingLink();
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result.data?.url) {
      window.location.href = result.data.url;
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    setError(null);
    const result = await refreshStripeAccountStatus();
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.reload();
  };

  const inner = (
    <>
      {!embedded && (
        <h2 className="mb-4 text-xl font-bold text-primary">Seller payouts</h2>
      )}

      {!profile.isActiveSeller ? (
        <div>
          <p
            className={
              embedded
                ? "mb-3 text-sm leading-snug text-muted-foreground"
                : "mb-4 text-base text-muted-foreground"
            }
          >
            Verify with Stripe to receive payouts after markets. Stripe collects your
            identity and bank details securely.
          </p>
          <ul
            className={
              embedded
                ? "mb-4 list-inside list-disc space-y-1 text-sm text-muted-foreground"
                : "mb-6 list-inside list-disc space-y-2 text-base text-muted-foreground"
            }
          >
            <li>List items at pop-up markets</li>
            <li>Rent hangers at market locations</li>
            <li>Receive payouts to your bank account</li>
          </ul>

          {stripeDetailsSubmitted && !stripePayoutsEnabled && (
            <p className="mb-4 rounded-lg border border-brand-lavender/40 bg-brand-lavender/10 p-3 text-sm text-foreground">
              Stripe is reviewing your details. Refresh status after completing
              onboarding.
            </p>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              type="button"
              variant="accent"
              size={embedded ? "default" : "lg"}
              className={embedded ? "h-10 text-sm" : undefined}
              disabled={loading}
              onClick={openStripeAccount}
            >
              {loading ? "Redirecting…" : "Verify with Stripe"}
            </Button>
            {stripeDetailsSubmitted && (
              <Button
                type="button"
                variant="outline"
                size={embedded ? "default" : "lg"}
                className={embedded ? "h-10 text-sm" : undefined}
                disabled={loading}
                onClick={refreshStatus}
              >
                Refresh status
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div
            className={
              embedded
                ? "mb-3 inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/20 px-3 py-1.5 text-sm font-semibold text-foreground"
                : "mb-4 inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/20 px-4 py-2 text-base font-semibold text-foreground"
            }
          >
            Active seller
          </div>
          <p
            className={
              embedded
                ? "mb-4 text-sm text-muted-foreground"
                : "mb-4 text-base text-muted-foreground"
            }
          >
            Your Stripe account is ready. You can sell at markets and receive admin
            payouts after events. Update bank details, tax information, and other
            payout settings on Stripe. When you finish, Stripe returns you to
            Bloem automatically.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              type="button"
              variant="outline"
              size={embedded ? "default" : "lg"}
              className={embedded ? "h-10 text-sm" : undefined}
              disabled={loading}
              onClick={openStripeAccount}
            >
              {loading ? "Redirecting…" : "Manage payout settings"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size={embedded ? "default" : "lg"}
              className={embedded ? "h-10 text-sm" : undefined}
              disabled={loading}
              onClick={refreshStatus}
            >
              Refresh status
            </Button>
          </div>
        </div>
      )}
    </>
  );

  if (embedded) {
    return inner;
  }

  return <div className="rounded-2xl border bg-card p-6 shadow-sm">{inner}</div>;
}
