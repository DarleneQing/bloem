"use client";

import { useEffect, useRef, useState } from "react";
import { calculateTimeRemaining, formatCountdownMmSs } from "@/lib/utils/cart";
import type { CartItemStatus } from "@/types/carts";
import { cn } from "@/lib/utils";

interface CheckoutReservationBadgeProps {
  expiresAt: string;
  status: CartItemStatus;
  onExpired?: () => void;
}

export function CheckoutReservationBadge({
  expiresAt,
  status,
  onExpired,
}: CheckoutReservationBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    calculateTimeRemaining(expiresAt)
  );

  const onExpiredRef = useRef(onExpired);
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        onExpiredRef.current?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = status === "EXPIRED" || timeRemaining <= 0;
  const isExpiring = status === "EXPIRING";

  return (
    <div
      className={cn(
        "flex min-w-[3.25rem] flex-col items-center justify-center rounded-lg px-2 py-1.5 text-center",
        isExpired
          ? "bg-destructive/10 text-destructive"
          : isExpiring
            ? "bg-amber-100 text-amber-800"
            : "bg-brand-accent/25 text-emerald-800"
      )}
      aria-live="polite"
    >
      <span className="text-sm font-bold tabular-nums leading-none">
        {isExpired ? "0:00" : formatCountdownMmSs(timeRemaining)}
      </span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">
        {isExpired ? "Expired" : "Reserve"}
      </span>
    </div>
  );
}
