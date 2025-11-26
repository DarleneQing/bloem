"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    // Update timer every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      // Call onExpired callback when timer reaches 0
      if (remaining <= 0 && onExpired) {
        onExpired();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  // Determine color based on status
  const getColorClass = () => {
    if (status === "EXPIRED" || timeRemaining <= 0) {
      return "text-destructive";
    }
    if (status === "EXPIRING") {
      return "text-yellow-600 dark:text-yellow-500";
    }
    return "text-muted-foreground";
  };

  // Format display text
  const displayText = timeRemaining <= 0
    ? "Expired"
    : `${formatTimeRemaining(timeRemaining)} remaining`;

  return (
    <div className={cn("flex items-center gap-1.5 text-sm font-medium", getColorClass())}>
      <Clock className="h-4 w-4" />
      <span>{displayText}</span>
    </div>
  );
}


