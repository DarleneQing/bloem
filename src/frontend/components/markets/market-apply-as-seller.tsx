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
  { icon: Camera, label: "Upload 4–5 style photos" },
  { icon: Tag, label: "Select brands" },
  { icon: Leaf, label: "Volunteer for commission-free sales" },
] as const;

function formatSubmittedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface MarketApplyAsSellerProps {
  variant?: "apply" | "pending" | "rejected";
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

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-brand-lavender/15 shadow-sm",
        className
      )}
      aria-labelledby="apply-as-seller-heading"
    >
      <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:gap-3 sm:p-5">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1 pr-2 sm:pr-28">
            <div className="flex items-start gap-2">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                aria-hidden
              >
                <Store className="h-4 w-4" />
              </span>
              <div className="min-w-0 space-y-1">
                <h2 id="apply-as-seller-heading" className="text-lg font-bold text-foreground">
                  Apply to Become a Seller
                </h2>
                <p className="text-sm text-muted-foreground">
                  Show your style and apply to sell at this market.
                </p>
              </div>
            </div>
          </div>

          {variant === "pending" && submittedAt && (
            <>
              <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
                    aria-hidden
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Application Under Review</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted on {formatSubmittedDate(submittedAt)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                We&apos;ll notify you within 3–5 business days about your application status.
              </p>
            </>
          )}

          {variant === "rejected" && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Your previous application was not approved. You can submit a new application below.
            </p>
          )}

          {showApplyFlow && (
            <>
              <ul className="space-y-2.5" aria-label="Application steps">
                {APPLY_STEPS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 pt-1">
                <Button
                  type="button"
                  onClick={onApply}
                  disabled={disabled || isPending}
                  className="h-12 w-full rounded-full text-base font-semibold"
                >
                  {isPending ? "Applying…" : applyLabel}
                </Button>
                <Link
                  href="/profile"
                  className="flex items-center justify-center gap-0.5 text-sm font-medium text-primary hover:underline"
                >
                  See seller requirements
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </>
          )}
        </div>

        <div
          className="pointer-events-none relative mx-auto h-36 w-36 shrink-0 sm:absolute sm:right-2 sm:top-2 sm:mx-0 sm:h-36 sm:w-36"
          aria-hidden
        >
          <Image
            src="/assets/images/apply-as-seller.png"
            alt=""
            fill
            sizes="(max-width: 640px) 144px, 144px"
            className="object-contain object-center"
          />
        </div>
      </div>
    </section>
  );
}

export function enrollmentVariant(
  status: MarketEnrollmentStatus | null | undefined
): "apply" | "pending" | "rejected" | null {
  if (!status) return "apply";
  if (status === "PENDING") return "pending";
  if (status === "REJECTED") return "rejected";
  return null;
}
