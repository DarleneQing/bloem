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
    setTimeRemaining(calculateTimeRemaining(expiresAt));

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
          ? "bg-destructive/10"
          : isExpiring
            ? "bg-amber-100"
            : "bg-brand-accent/20"
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          "text-sm font-medium tabular-nums leading-none",
          isExpired
            ? "text-destructive"
            : isExpiring
              ? "text-amber-800"
              : "text-brand-accent"
        )}
      >
        {isExpired ? "0:00" : formatCountdownMmSs(timeRemaining)}
      </span>
      <span
        className={cn(
          "mt-0.5 text-[length:10px] font-bold uppercase tracking-wide",
          isExpired
            ? "text-destructive"
            : isExpiring
              ? "text-amber-800"
              : "text-foreground"
        )}
      >
        {isExpired ? "Expired" : "Reserved"}
      </span>
    </div>
  );
}

