"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import { getStripeJs } from "@/lib/stripe/client";
import { Button } from "@/components/ui/button";

interface StripePaymentFormProps {
  clientSecret: string;
  amountLabel: string;
  returnUrl: string;
  onError?: (message: string) => void;
}

function PaymentFormInner({
  amountLabel,
  returnUrl,
  onError,
}: Omit<StripePaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    if (error) {
      onError?.(error.message ?? "Payment failed");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
        <Lock className="h-4 w-4 shrink-0" aria-hidden />
        <span>Secure payment</span>
      </div>
      <PaymentElement />
      <Button
        type="submit"
        size="lg"
        disabled={!stripe || !elements || isSubmitting}
        className="h-12 w-full rounded-full text-base font-bold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing…
          </>
        ) : (
          `Pay ${amountLabel}`
        )}
      </Button>
    </form>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const { clientSecret, ...rest } = props;

  return (
    <Elements stripe={getStripeJs()} options={{ clientSecret }}>
      <PaymentFormInner {...rest} />
    </Elements>
  );
}
