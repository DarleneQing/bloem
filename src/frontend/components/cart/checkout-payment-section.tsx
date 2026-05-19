"use client";

import type { ReactNode } from "react";
import { Lock, Loader2 } from "lucide-react";

interface CheckoutPaymentSectionProps {
  isLoadingSession?: boolean;
  sessionError?: string | null;
  children?: ReactNode;
}

export function CheckoutPaymentSection({
  isLoadingSession = false,
  sessionError,
  children,
}: CheckoutPaymentSectionProps) {
  return (
    <section
      className="rounded-2xl bg-brand-lavender/20 p-4"
      aria-labelledby="checkout-payment-heading"
    >
      <div
        id="checkout-payment-heading"
        className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Secure payment</span>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Enter your payment details below. Powered by Stripe.
      </p>

      {isLoadingSession && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading payment form" />
          <span>Preparing secure payment…</span>
        </div>
      )}

      {!isLoadingSession && sessionError && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {sessionError}
        </p>
      )}

      {!isLoadingSession && !sessionError && children}
    </section>
  );
}
