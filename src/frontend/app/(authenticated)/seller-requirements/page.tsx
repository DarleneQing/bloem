import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  CreditCard,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SELLER_AFTER_APPROVAL,
  SELLER_APPLICATION_EXPECTATIONS,
  SELLER_APPLICATION_REVIEW_MESSAGE,
  SELLER_BENEFITS,
  SELLER_JOURNEY_STEPS,
  SELLER_REQUIREMENTS,
} from "@/lib/markets/seller-onboarding-copy";

export const metadata = {
  title: "Seller requirements · bloem",
  description: "What you need to become a verified seller on bloem.",
};

const REQUIREMENT_ICONS = [BadgeCheck, CreditCard, Store] as const;

export default function SellerRequirementsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-4 md:max-w-2xl md:py-6">
      <header className="mb-5 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-full">
          <Link href="/markets" aria-label="Back to markets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-lg font-bold text-foreground">Seller requirements</h1>
      </header>

      <section className="relative mb-5 min-h-[7.5rem] overflow-hidden rounded-2xl">
        <Image
          src="/assets/images/verify-to-be-seller-banner.png"
          alt=""
          fill
          className="object-cover object-right"
          sizes="(max-width: 768px) 100vw, 672px"
        />
        <div className="relative flex max-w-[65%] flex-col justify-center gap-2 px-4 py-5 pr-2">
          <p className="text-sm font-bold text-foreground">Become a verified seller</p>
          <p className="text-xs text-muted-foreground">
            bloem is a circular-fashion marketplace. Here is what to expect from verification
            through your first market day.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-bold text-foreground">What you need</h2>
        <ul className="mt-3 space-y-3">
          {SELLER_REQUIREMENTS.map(({ title, description }, index) => {
            const Icon = REQUIREMENT_ICONS[index] ?? BadgeCheck;
            return (
              <li key={title} className="flex gap-3 rounded-2xl border bg-background p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-lavender/30 text-brand-purple">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="my-5 flex justify-center" aria-hidden>
        <Image
          src="/assets/images/leaf_sprout_icon.svg"
          alt=""
          width={28}
          height={28}
          className="opacity-70"
        />
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-bold text-foreground">Your seller journey</h2>
        <ol className="mt-4 space-y-4">
          {SELLER_JOURNEY_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-purple text-sm font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="my-5 flex justify-center" aria-hidden>
        <Image
          src="/assets/images/leaf-purple.png"
          alt=""
          width={32}
          height={32}
          className="opacity-80"
        />
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-bold text-foreground">What we ask in your application</h2>
        <p className="mt-2 text-sm text-muted-foreground">{SELLER_APPLICATION_REVIEW_MESSAGE}</p>
        <ul className="mt-4 space-y-3">
          {SELLER_APPLICATION_EXPECTATIONS.map((item) => (
            <li key={item.title} className="rounded-2xl border bg-background p-4">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="relative mb-4 h-24 overflow-hidden rounded-xl">
          <Image
            src="/assets/images/account-active-banner.png"
            alt=""
            fill
            className="object-cover object-right"
            sizes="320px"
          />
        </div>
        <h2 className="text-base font-bold text-foreground">After you are approved</h2>
        <ul className="mt-3 space-y-2">
          {SELLER_AFTER_APPROVAL.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h2 className="mb-3 text-base font-bold text-foreground">What you can do once verified</h2>
        <ul className="space-y-2">
          {SELLER_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-foreground">
              <BadgeCheck className="h-4 w-4 shrink-0 text-brand-purple" aria-hidden />
              {benefit}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 space-y-3">
        <Button asChild className="w-full">
          <Link href="/profile?activate=seller">
            Get verified
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/markets">Browse markets</Link>
        </Button>
      </div>
    </div>
  );
}
