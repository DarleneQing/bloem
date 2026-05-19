"use client";

import { useState } from "react";
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckout,
} from "@stripe/react-stripe-js/checkout";
import { AlertCircle, Loader2 } from "lucide-react";
import { getStripeJs } from "@/lib/stripe/client";

export const CHECKOUT_PAYMENT_FORM_ID = "checkout-payment-form";

interface StripeCheckoutPaymentFormProps {
  clientSecret: string;
  disabled?: boolean;
  onReady?: () => void;
  onError?: (message: string) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

function CheckoutPaymentFields({
  disabled,
  onReady,
  onError,
  onSubmittingChange,
}: Omit<StripeCheckoutPaymentFormProps, "clientSecret">) {
  const checkoutState = useCheckout();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  if (checkoutState.type === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>Preparing payment…</span>
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <p className="text-sm text-destructive" role="alert">
        {checkoutState.error.message}
      </p>
    );
  }

  const { checkout } = checkoutState;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    setLastError(null);
    setIsSubmitting(true);
    onSubmittingChange?.(true);

    try {
      const result = await checkout.confirm();

      if (result.type === "error") {
        const message = result.error.message ?? "Payment failed";
        setLastError(message);
        onError?.(message);
        setIsSubmitting(false);
        onSubmittingChange?.(false);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setLastError(message);
      onError?.(message);
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  };

  return (
    <form id={CHECKOUT_PAYMENT_FORM_ID} onSubmit={handleSubmit}>
      {lastError && (
        <div
          className="mb-4 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{lastError}</p>
            <p className="mt-0.5 text-xs text-destructive/80">
              Please check your details and try again.
            </p>
          </div>
        </div>
      )}
      <PaymentElement
        onReady={() => {
          onReady?.();
        }}
        onChange={() => {
          if (lastError) setLastError(null);
        }}
      />
    </form>
  );
}

export function StripeCheckoutPaymentForm({
  clientSecret,
  ...rest
}: StripeCheckoutPaymentFormProps) {
  return (
    <CheckoutElementsProvider stripe={getStripeJs()} options={{ clientSecret }}>
      <CheckoutPaymentFields {...rest} />
    </CheckoutElementsProvider>
  );
}
