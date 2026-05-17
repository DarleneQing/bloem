"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Trash2 } from "lucide-react";
import type { EnrichedCartItem } from "@/types/carts";
import { CheckoutReservationBadge } from "./checkout-reservation-badge";
import { formatChfPrice } from "@/lib/qr/item-detail-helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CheckoutCartItemRowProps {
  cartItem: EnrichedCartItem;
  isEditing?: boolean;
  isRemoving?: boolean;
  isExtending?: boolean;
  onRemove?: (cartItemId: string) => void;
  onExtend?: (cartItemId: string) => void;
}

function formatCondition(condition: string | null | undefined): string | null {
  if (!condition) return null;
  return condition
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatAttributes(cartItem: EnrichedCartItem): string {
  const parts: string[] = [];
  if (cartItem.item.size?.name) {
    parts.push(`Size ${cartItem.item.size.name}`);
  }
  const condition = formatCondition(cartItem.item.condition);
  if (condition) {
    parts.push(condition);
  }
  return parts.join(" • ");
}

export function CheckoutCartItemRow({
  cartItem,
  isEditing = false,
  isRemoving = false,
  isExtending = false,
  onRemove,
  onExtend,
}: CheckoutCartItemRowProps) {
  const { item, status, can_extend } = cartItem;
  const attributes = formatAttributes(cartItem);
  const priceLabel = formatChfPrice(item.selling_price);
  const isExpired = status === "EXPIRED";

  return (
    <div
      className={cn(
        "flex gap-3 py-3 first:pt-0 last:pb-0",
        isExpired && "opacity-60"
      )}
    >
      <Link
        href={`/items/${item.id}`}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted"
      >
        <Image
          src={item.thumbnail_url}
          alt={item.title}
          fill
          className="object-cover"
          sizes="64px"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={`/items/${item.id}`} className="hover:underline">
          <h3 className="truncate font-semibold text-foreground">{item.title}</h3>
        </Link>
        {attributes ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{attributes}</p>
        ) : null}
        {priceLabel ? (
          <p className="mt-1 font-semibold text-foreground">{priceLabel}</p>
        ) : null}

        {isEditing && (
          <div className="mt-2 flex flex-wrap gap-2">
            {can_extend && status === "EXPIRING" && onExtend && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={isExtending || isExpired}
                onClick={() => onExtend(cartItem.id)}
              >
                <Clock className="mr-1 h-3 w-3" />
                Extend
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={isRemoving}
                onClick={() => onRemove(cartItem.id)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      {!isEditing && (
        <CheckoutReservationBadge
          expiresAt={cartItem.expires_at}
          status={status}
        />
      )}
    </div>
  );
}
