"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Leaf,
  Store,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MarketEnrollmentStatus } from "@/lib/markets/enrollment-status";

const APPLY_STEPS = [
  {
    icon: Camera,
    label: "Upload 4–5 style photos",
    iconWrapClassName: "bg-primary/10 text-primary",
  },
  {
    icon: Tag,
    label: "Select brands",
    iconWrapClassName: "bg-primary/10 text-primary",
  },
  {
    icon: Leaf,
    label: "Volunteer for commission-free sales",
    iconWrapClassName: "bg-brand-accent/15 text-brand-accent",
  },
] as const;

const APPLY_SELLER_BG = "/assets/images/apply-as-seller.png";

type ApplySectionVariant = "apply" | "pending" | "approved" | "rejected";

function formatSubmittedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ApplicationStatusCardProps {
  title: string;
  subtitle: string;
  iconClassName: string;
}

function ApplicationStatusCard({ title, subtitle, iconClassName }: ApplicationStatusCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 p-2 shadow-sm backdrop-blur-[2px] sm:rounded-xl sm:p-2.5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8",
            iconClassName
          )}
          aria-hidden
        >
          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground sm:text-sm">{title}</p>
          <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">{subtitle}</p>
        </div>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" aria-hidden />
      </div>
    </div>
  );
}

interface MarketApplyAsSellerProps {
  variant?: ApplySectionVariant;
  submittedAt?: string;
  onApply?: () => void;
  disabled?: boolean;
  isPending?: boolean;
  applyLabel?: string;
  className?: string;
}

export function MarketApplyAsSeller({
  variant = "apply",
  submittedAt,
  onApply,
  disabled = false,
  isPending = false,
  applyLabel = "Apply to Become a Seller",
  className,
}: MarketApplyAsSellerProps) {
  const showApplyFlow = variant === "apply" || variant === "rejected";
  const statusDateLabel = submittedAt
    ? formatSubmittedDate(submittedAt)
    : null;

  const footerNote =
    variant === "pending"
      ? "We'll notify you within 3–5 business days about your application status."
      : variant === "approved"
        ? "Reserve hangers below to complete your vendor setup for this market."
        : null;

  return (
    <div className={cn("space-y-3", className)}>
    <section
      className="relative isolate min-h-[10.5rem] overflow-hidden rounded-2xl border border-border/70 shadow-sm sm:min-h-[12rem]"
      aria-labelledby="apply-as-seller-heading"
    >
      <Image
        src={APPLY_SELLER_BG}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 768px"
        className="pointer-events-none object-cover object-center select-none"
        aria-hidden
      />

      <div className="relative z-10 flex max-w-[62%] flex-col gap-2.5 p-4 sm:max-w-[58%] sm:gap-3 sm:p-5">
        <div className="flex items-start gap-1.5 sm:gap-2">
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-7 sm:w-7"
            aria-hidden
          >
            <Store className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <h2
              id="apply-as-seller-heading"
              className="text-sm font-bold leading-snug text-foreground sm:text-base"
            >
              Apply to Become a Seller
            </h2>
            <p className="text-xs leading-snug text-muted-foreground">
              Show your style and apply to sell at this market.
            </p>
          </div>
        </div>

        {variant === "pending" && (
          <ApplicationStatusCard
            title="Application Under Review"
            subtitle={
              statusDateLabel
                ? `Submitted on ${statusDateLabel}`
                : "Your application has been submitted"
            }
            iconClassName="bg-brand-accent/15 text-brand-accent"
          />
        )}

        {variant === "approved" && (
          <ApplicationStatusCard
            title="Application Approved"
            subtitle={
              statusDateLabel
                ? `Approved · applied ${statusDateLabel}`
                : "You are approved to sell at this market"
            }
            iconClassName="bg-brand-accent/15 text-brand-accent"
          />
        )}

        {variant === "rejected" && (
          <p className="rounded-lg bg-destructive/10 px-2 py-1.5 text-[11px] text-destructive backdrop-blur-[2px] sm:text-xs">
            Your previous application was not approved. You can submit a new application below.
          </p>
        )}

        {showApplyFlow && (
          <>
            <ul className="space-y-1.5 sm:space-y-2" aria-label="Application steps">
              {APPLY_STEPS.map(({ icon: Icon, label, iconWrapClassName }) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7",
                      iconWrapClassName
                    )}
                    aria-hidden
                  >
                    <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.25} />
                  </span>
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {footerNote ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{footerNote}</p>
        ) : null}
      </div>
    </section>

    {showApplyFlow && (
      <Button
        type="button"
        onClick={onApply}
        disabled={disabled || isPending}
        className="h-11 w-full rounded-full text-sm font-semibold"
      >
        {isPending ? "Applying…" : applyLabel}
      </Button>
    )}

    {showApplyFlow && (
      <Link
        href="/profile"
        className="flex w-full items-center justify-center gap-0.5 text-sm font-medium text-primary hover:underline"
      >
        See seller requirements
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    )}
    </div>
  );
}

export function enrollmentVariant(
  status: MarketEnrollmentStatus | null | undefined
): ApplySectionVariant {
  if (status === "PENDING") return "pending";
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED") return "rejected";
  return "apply";
}
