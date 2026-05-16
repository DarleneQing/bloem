"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { calculateTimeRemaining, formatTimeRemaining } from "@/lib/utils/cart";
import type { CartItemStatus } from "@/types/carts";
import { cn } from "@/lib/utils";

interface ReservationTimerProps {
  expiresAt: string;
  status: CartItemStatus;
  onExpired?: () => void;
}

/**
 * Countdown timer for cart item reservation
 * Updates every second and shows time remaining
 */
export function ReservationTimer({
  expiresAt,
  status,
  onExpired,
}: ReservationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(
    calculateTimeRemaining(expiresAt)
  );

  // Hold the latest onExpired in a ref so the interval effect doesn't need
  // to depend on it. Parents commonly pass an inline `() => …` here, which
  // would otherwise tear down and recreate the interval on every render.
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

  const getColorClass = () => {
    if (isExpired) return "text-destructive";
    if (isExpiring) return "text-brand-purple";
    return "text-muted-foreground";
  };

  let displayText: string;
  if (isExpired) {
    displayText = "Time's up — this piece returned to the rack";
  } else if (isExpiring) {
    displayText = `Hurry — ${formatTimeRemaining(timeRemaining)} left`;
  } else {
    displayText = `${formatTimeRemaining(timeRemaining)} left`;
  }

  return (
    <div className={cn("flex items-center gap-1.5 text-sm font-medium", getColorClass())}>
      <Clock className="h-4 w-4" />
      <span>{displayText}</span>
    </div>
  );
}





