"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createHangerRental, updateHangerRental } from "@/features/hanger-rentals/actions";
import { getMyHangerRentals } from "@/features/hanger-rentals/queries";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HangerRentalPaymentDialog } from "@/components/markets/hanger-rental-payment-dialog";

const HANGER_ICON_SRC = "/assets/images/hanger_icon.png";

interface HangerRentalFormProps {
  marketId: string;
  hangerPrice: number;
  limits?: { unlimited: boolean; maxPerSeller?: number };
  capacity?: { availableHangers: number };
  onProceedToPayment?: (rentalId: string) => void;
  onChange?: () => void;
  variant?: "default" | "compact";
  className?: string;
}

export default function HangerRentalForm({
  marketId,
  hangerPrice,
  limits,
  capacity,
  onProceedToPayment,
  onChange,
  className,
}: HangerRentalFormProps) {
  const [qty, setQty] = useState<number>(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<boolean>(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const maxAllowed = useMemo(() => {
    const perSeller = limits ? (limits.unlimited ? Infinity : (limits.maxPerSeller ?? 5)) : Infinity;
    const byCapacity = capacity?.availableHangers ?? Infinity;
    const cap = Math.max(0, Math.min(perSeller, byCapacity)) || 0;
    return Number.isFinite(cap) ? Math.max(0, Math.floor(cap)) : 99;
  }, [limits, capacity]);

  const totalPrice = useMemo(() => (qty > 0 ? qty * Number(hangerPrice || 0) : 0), [qty, hangerPrice]);

  // Avoid duplicate fetches (e.g., StrictMode double-invoke in dev)
  const loadedRef = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    if (loadedRef.current === marketId) return;
    async function load() {
      const rentals = await getMyHangerRentals();
      if (!active) return;
      const existing = rentals.find((r) => r.market_id === marketId && r.status === "PENDING");
      if (existing) {
        setPendingId(existing.id);
        setQty(existing.hanger_count);
      } else {
        setPendingId(null);
        setEditing(false);
      }
      loadedRef.current = marketId;
    }
    load();
    return () => { active = false; };
  }, [marketId]);

  const onSubmit = () => {
    setError(null);
    if (qty < 1) { setError("Quantity must be at least 1"); return; }
    if (maxAllowed > 0 && qty > maxAllowed) { setError(`Max allowed is ${maxAllowed}`); return; }
    startTransition(async () => {
      const res = pendingId
        ? await updateHangerRental({ id: pendingId, hangerCount: qty })
        : await createHangerRental({ marketId, hangerCount: qty });
      if ((res as any).error) {
        setError((res as any).error);
      } else {
        const data = (res as any).data as any;
        if (!pendingId && data && data.market_id === marketId) {
          setPendingId(data.id);
          setQty(data.hanger_count ?? qty);
          setEditing(false);
          if (onChange) onChange();
          return;
        }
        // Fallback: refresh existing state
        const rentals = await getMyHangerRentals();
        const existing = rentals.find((r) => r.market_id === marketId && r.status === "PENDING");
        setPendingId(existing ? existing.id : null);
        if (existing) setQty(existing.hanger_count);
        setEditing(false);
        if (onChange) onChange();
      }
    });
  };

  const disabled = isPending || maxAllowed === 0;

  const openPayment = () => {
    if (onProceedToPayment && pendingId) {
      onProceedToPayment(pendingId);
      return;
    }
    if (pendingId) {
      setPaymentOpen(true);
    }
  };

  const inc = () => setQty((q) => Math.min(Number.isFinite(maxAllowed) ? maxAllowed : q + 1, q + 1));
  const dec = () => setQty((q) => Math.max(1, q - 1));

  const paymentDialog = pendingId ? (
    <HangerRentalPaymentDialog
      rentalId={pendingId}
      marketId={marketId}
      amount={totalPrice}
      open={paymentOpen}
      onOpenChange={setPaymentOpen}
    />
  ) : null;

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Image
                src={HANGER_ICON_SRC}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                aria-hidden
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Standard hanger</p>
            </div>
            <p className="shrink-0 text-lg font-bold text-foreground">
              CHF {Number(hangerPrice).toFixed(0)}
            </p>
          </div>

          {pendingId && !editing ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {qty} hanger{qty === 1 ? "" : "s"} reserved · CHF {totalPrice.toFixed(2)} total
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                  Update
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-brand-accent text-foreground hover:bg-brand-accent/90"
                  onClick={openPayment}
                >
                  Proceed to payment
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={dec}
                disabled={disabled || qty <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-lg disabled:opacity-50"
                aria-label="Decrease hangers"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                onClick={inc}
                disabled={disabled || (Number.isFinite(maxAllowed) && qty >= maxAllowed)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-lg disabled:opacity-50"
                aria-label="Increase hangers"
              >
                +
              </button>
              <Button
                type="button"
                size="sm"
                className="ml-2 bg-brand-accent text-foreground hover:bg-brand-accent/90"
                onClick={onSubmit}
                disabled={disabled}
              >
                {pendingId ? (isPending ? "Updating..." : "Update") : isPending ? "Saving..." : "Reserve"}
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}
        {pendingId && (
          <p className="text-xs text-muted-foreground">
            Pending rentals auto-cancel after 24 hours if not confirmed.
          </p>
        )}
      </div>
      {paymentDialog}
    </>
  );
}


