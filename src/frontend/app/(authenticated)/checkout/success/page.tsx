import Link from "next/link";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe/server";
import { Button } from "@/components/ui/button";

interface CheckoutSuccessPageProps {
  searchParams: { payment_intent?: string; redirect_status?: string };
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const paymentIntentId = searchParams.payment_intent;

  if (!paymentIntentId) {
    redirect("/checkout");
  }

  let status = "processing";
  let message =
    "Your payment is being confirmed. Items will show as purchased shortly.";

  try {
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === "succeeded") {
      status = "succeeded";
      message = "Payment received. Your items are being finalized.";
    } else if (paymentIntent.status === "processing") {
      status = "processing";
    } else {
      status = "failed";
      message = "Payment was not completed. You can return to checkout and try again.";
    }
  } catch {
    status = "unknown";
    message = "We could not verify payment status. Check your email or order history.";
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">
        {status === "succeeded" ? "Thank you" : "Payment status"}
      </h1>
      <p className="mt-3 text-muted-foreground">{message}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/markets">Browse markets</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/checkout">Back to checkout</Link>
        </Button>
      </div>
    </div>
  );
}
