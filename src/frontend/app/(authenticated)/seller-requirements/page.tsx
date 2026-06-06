import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  CreditCard,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Seller requirements · bloem",
  description: "What you need to become a verified seller on bloem.",
};

export default function SellerRequirementsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-4 md:max-w-2xl md:py-6">
      <header className="mb-5 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-full">
          <Link href="/markets" aria-label="Back to markets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-lg font-bold text-foreground">
          Seller requirements
        </h1>
      </header>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          bloem is a circular-fashion marketplace. To sell at our pop-up markets
          you first need to become a{" "}
          <span className="font-medium text-foreground">verified seller</span>.
          Here&apos;s what that takes.
        </p>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-base font-bold text-foreground">What you need</h2>
        <ul className="space-y-3">
          {REQUIREMENTS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-3 rounded-2xl border bg-card p-4 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-lavender/30 text-brand-purple">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-base font-bold text-foreground">
          What you can do once verified
        </h2>
        <ul className="space-y-2">
          {SELLER_BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-brand-purple"
                aria-hidden
              />
              {benefit}
            </li>
          ))}
        </ul>
      </section>

      <Button asChild className="mt-6 w-full">
        <Link href="/profile">
          Get verified
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

const REQUIREMENTS = [
  {
    icon: BadgeCheck,
    title: "A complete bloem profile",
    description:
      "Sign up and fill in your profile — your name, contact details, and address.",
  },
  {
    icon: CreditCard,
    title: "Identity & bank verification",
    description:
      "Verify your identity and bank account through Stripe. Stripe securely collects your details so your payouts can reach you.",
  },
  {
    icon: Store,
    title: "Enrollment in a market",
    description:
      "Once verified, apply to a pop-up market and reserve the hangers you need to list your items.",
  },
] as const;

const SELLER_BENEFITS = [
  "List items at pop-up markets",
  "Rent hangers at market locations",
  "Receive payouts to your bank account",
] as const;
