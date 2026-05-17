"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CheckoutPaymentMethodProps {
  cardLabel?: string;
  cardBrand?: string;
}

export function CheckoutPaymentMethod({
  cardLabel = "Visa ending in 4242",
  cardBrand = "VISA",
}: CheckoutPaymentMethodProps) {
  const { toast } = useToast();

  return (
    <section className="rounded-2xl bg-brand-lavender/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
        <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Secure Payment</span>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-card/80 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-7 min-w-[2.75rem] items-center justify-center rounded bg-white px-1.5 text-[10px] font-bold tracking-tight text-[#1A1F71] shadow-sm">
            {cardBrand}
          </span>
          <span className="truncate text-sm text-muted-foreground">{cardLabel}</span>
        </div>
        <Button
          type="button"
          variant="link"
          className="h-auto shrink-0 px-0 text-sm font-semibold text-primary"
          onClick={() =>
            toast({
              title: "Payment methods",
              description: "Saved cards will be available in a future update.",
            })
          }
        >
          Change
        </Button>
      </div>
    </section>
  );
}
