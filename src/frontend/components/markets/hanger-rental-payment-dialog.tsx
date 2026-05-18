"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StripePaymentForm } from "@/components/stripe/stripe-payment-form";
import { formatChfPrice } from "@/lib/qr/item-detail-helpers";
import { useToast } from "@/hooks/use-toast";

interface HangerRentalPaymentDialogProps {
  rentalId: string;
  marketId: string;
  amount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HangerRentalPaymentDialog({
  rentalId,
  marketId,
  amount,
  open,
  onOpenChange,
}: HangerRentalPaymentDialogProps) {
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      return;
    }

    let cancelled = false;

    async function loadIntent() {
      setLoading(true);
      try {
        const res = await fetch(`/api/hanger-rentals/${rentalId}/payment-intent`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Could not start payment");
        }
        if (!cancelled) {
          setClientSecret(data.clientSecret);
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Payment unavailable",
            description: err instanceof Error ? err.message : "Try again later",
            variant: "destructive",
          });
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadIntent();
    return () => {
      cancelled = true;
    };
  }, [open, rentalId, onOpenChange, toast]);

  const amountLabel = formatChfPrice(amount) ?? "CHF 0.00";
  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/markets/${marketId}?rental_paid=1`
      : `/markets/${marketId}?rental_paid=1`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay for hangers</DialogTitle>
          <DialogDescription>
            Complete payment to confirm your hanger rental ({amountLabel}).
          </DialogDescription>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Loading payment…</p>}
        {clientSecret && !loading && (
          <StripePaymentForm
            clientSecret={clientSecret}
            amountLabel={amountLabel}
            returnUrl={returnUrl}
            onError={(message) =>
              toast({ title: "Payment failed", description: message, variant: "destructive" })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
