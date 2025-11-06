"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createHangerRental, updateHangerRental, cancelHangerRental } from "@/features/hanger-rentals/actions";
import { getMyHangerRentals } from "@/features/hanger-rentals/queries";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface HangerRentalFormProps {
  marketId: string;
  hangerPrice: number;
  limits?: { unlimited: boolean; maxPerSeller?: number };
  capacity?: { availableHangers: number };
  onProceedToPayment?: (rentalId: string) => void;
  onChange?: () => void;
}

export default function HangerRentalForm({ marketId, hangerPrice, limits, capacity, onProceedToPayment, onChange }: HangerRentalFormProps) {
  const [qty, setQty] = useState<number>(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<boolean>(false);

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

  const onCancel = () => {
    if (!pendingId) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelHangerRental(pendingId);
      if ((res as any).error) {
        setError((res as any).error);
      } else {
        setPendingId(null);
        setEditing(false);
        if (onChange) onChange();
      }
    });
  };

  const disabled = isPending || maxAllowed === 0;

  const inc = () => setQty((q) => Math.min(Number.isFinite(maxAllowed) ? maxAllowed : q + 1, q + 1));
  const dec = () => setQty((q) => Math.max(1, q - 1));
  const addN = (n: number) => setQty((q) => {
    const cap = Number.isFinite(maxAllowed) ? (maxAllowed as number) : q + n;
    return Math.max(1, Math.min(cap, q + n));
  });
  const resetQty = () => setQty(1);

  return (
    <div className="space-y-4 rounded-2xl border p-4 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-[#6B22B1]">Rent Hangers</div>
          <div className="text-xs text-gray-500">€{Number(hangerPrice).toFixed(2)} per hanger</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {typeof capacity?.availableHangers === "number" && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
              Available: {capacity.availableHangers}
            </span>
          )}
          {limits && (
            <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-[#6B22B1] whitespace-nowrap">
              <span className="hidden sm:inline">{limits.unlimited ? "Per seller: Unlimited" : `Per seller max: ${limits.maxPerSeller ?? 5}`}</span>
              <span className="sm:hidden">{limits.unlimited ? "Unlimited" : `Max ${limits.maxPerSeller ?? 5}`}</span>
            </span>
          )}
        </div>
      </div>

      {/* Pending Summary or Quantity Controls */}
      {pendingId && !editing ? (
        <div className="flex flex-col gap-3 rounded-md bg-[#F7F4F2] px-3 py-2 overflow-hidden">
          <div className="text-sm text-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Hangers</span>
              <span className="text-gray-600">{qty} × €{Number(hangerPrice).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="text-sm font-semibold">Total €{totalPrice.toFixed(2)}</div>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:justify-end w-full">
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)} className="w-full sm:w-auto">Update</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" size="sm" variant="outline" className="w-full sm:w-auto">Cancel</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md max-w-[90vw]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel pending rental?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will release your reserved hangers for this market.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
                  <AlertDialogCancel asChild>
                    <Button
                      variant="outline"
                      disabled={isPending}
                      className="w-full sm:w-auto rounded-full border-2 border-[#6B22B1] text-[#6B22B1] hover:bg-[#6B22B1]/5"
                    >
                      Back
                    </Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={onCancel}
                      disabled={isPending}
                      className="w-full sm:w-auto rounded-full"
                    >
                      {isPending ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Cancelling...
                        </>
                      ) : (
                        "Confirm Cancel"
                      )}
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="button"
              size="sm"
              className="bg-[#BED35C] text-black hover:bg-[#A8BD4A] w-full sm:w-auto"
              onClick={() => {
                if (onProceedToPayment && pendingId) { onProceedToPayment(pendingId); }
                else if (typeof window !== "undefined") { window.alert("Payment flow coming soon."); }
              }}
            >
              Proceed to payment
            </Button>
          </div>
        </div>
      ) : (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={dec}
          disabled={disabled || qty <= 1}
          className="h-9 w-9 rounded-full border text-lg leading-none disabled:opacity-50"
          aria-label="Decrease hangers"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={Number.isFinite(maxAllowed) ? maxAllowed : undefined}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          className="w-20 text-center border rounded-md py-2"
          disabled={disabled}
          aria-label="Hanger count"
        />
        <button
          type="button"
          onClick={inc}
          disabled={disabled || (Number.isFinite(maxAllowed) && qty >= maxAllowed)}
          className="h-9 w-9 rounded-full border text-lg leading-none disabled:opacity-50"
          aria-label="Increase hangers"
        >
          +
        </button>
        {/* Quick add buttons */}
        <div className="ml-2 flex items-center gap-2">
          {[2,5,10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => addN(n)}
              disabled={disabled || (Number.isFinite(maxAllowed) && qty >= (maxAllowed as number))}
              className="px-2 py-1 rounded border text-xs disabled:opacity-50"
              aria-label={`Add ${n} hangers`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={resetQty}
            disabled={disabled || qty === 1}
            className="px-2 py-1 rounded border text-xs disabled:opacity-50"
            aria-label="Reset hangers"
          >
            Reset
          </button>
        </div>
      </div>
      )}

      {/* Price Summary */}
      {(!pendingId || editing) && (
        <div className="flex items-center justify-between text-sm bg-[#F7F4F2] rounded-md px-3 py-2">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold">€{totalPrice.toFixed(2)}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Actions (only when not in pending summary) */}
      {!pendingId || editing ? (
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            onClick={() => {
              onSubmit();
              if (pendingId) setEditing(false);
            }}
            disabled={disabled}
            size="sm"
            className="bg-[#BED35C] text-black hover:bg-[#A8BD4A] hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 transition-all duration-200"
          >
            {pendingId ? (isPending ? "Updating..." : "Update") : (isPending ? "Renting..." : "Rent Hangers")}
          </Button>
          {pendingId && editing && (
            <Button
              type="button"
              onClick={() => setEditing(false)}
              variant="outline"
              size="sm"
            >
              Back
            </Button>
          )}
        </div>
      ) : null}

      {/* Pending Note */}
      {pendingId && (
        <div className="text-xs text-gray-600">Pending rentals auto-cancel after 24 hours if not confirmed.</div>
      )}
    </div>
  );
}


