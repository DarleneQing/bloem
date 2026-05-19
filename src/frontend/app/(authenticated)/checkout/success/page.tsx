import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { getStripe } from "@/lib/stripe/server";
import { Button } from "@/components/ui/button";
import {
  cartCheckoutFulfillmentFromSession,
  fulfillCartCheckout,
} from "@/lib/stripe/webhook-handlers";

type PaymentStatus = "succeeded" | "processing" | "failed" | "unknown";

interface StatusConfig {
  icon: React.ReactNode;
  heading: string;
  message: string;
  accent: string;
}

const STATUS_MAP: Record<PaymentStatus, StatusConfig> = {
  succeeded: {
    icon: <CheckCircle2 className="h-12 w-12 text-brand-accent" />,
    heading: "Thank you!",
    message: "Payment received. Your items are being finalized.",
    accent: "bg-brand-accent/10",
  },
  processing: {
    icon: <Clock className="h-12 w-12 text-primary" />,
    heading: "Processing payment",
    message: "Your payment is being confirmed. Items will show as purchased shortly.",
    accent: "bg-primary/10",
  },
  failed: {
    icon: <XCircle className="h-12 w-12 text-destructive" />,
    heading: "Payment not completed",
    message: "Your card was declined or the payment could not be processed. No charge was made — you can return to checkout and try again.",
    accent: "bg-destructive/10",
  },
  unknown: {
    icon: <AlertTriangle className="h-12 w-12 text-yellow-600" />,
    heading: "Status unavailable",
    message: "We could not verify payment status. If you were charged, your order will still be fulfilled. Check your email or try refreshing this page.",
    accent: "bg-yellow-50",
  },
};

interface CheckoutSuccessPageProps {
  searchParams: { session_id?: string; payment_intent?: string; redirect_status?: string };
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const sessionId = searchParams.session_id;
  const paymentIntentId = searchParams.payment_intent;

  if (!sessionId && !paymentIntentId) {
    redirect("/checkout");
  }

  let status: PaymentStatus = "processing";

  try {
    if (sessionId) {
      const session = await getStripe().checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"],
      });

      if (session.status === "complete" && session.payment_status === "paid") {
        status = "succeeded";

        const fulfillment = cartCheckoutFulfillmentFromSession(session);
        if (fulfillment) {
          try {
            await fulfillCartCheckout(fulfillment);
          } catch (err) {
            console.error("Fallback fulfillment failed:", err);
          }
        }
      } else if (session.status === "expired") {
        status = "failed";
      } else if (session.status === "open") {
        status = "processing";
      } else {
        status = "failed";
      }
    } else if (paymentIntentId) {
      const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status === "succeeded") {
        status = "succeeded";
      } else if (paymentIntent.status === "processing") {
        status = "processing";
      } else if (
        paymentIntent.status === "requires_payment_method" ||
        paymentIntent.status === "canceled"
      ) {
        status = "failed";
      } else {
        status = "processing";
      }
    }
  } catch {
    status = "unknown";
  }

  const config = STATUS_MAP[status];

  return (
    <div className="container mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <div className={`mb-6 rounded-full p-4 ${config.accent}`}>
        {config.icon}
      </div>
      <h1 className="text-2xl font-bold text-foreground">{config.heading}</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">{config.message}</p>

      <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        {status === "failed" ? (
          <>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/checkout">Try again</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/markets">Browse markets</Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild size="lg" className="rounded-full">
              <Link href="/markets">Browse markets</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/wardrobe">My wardrobe</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
