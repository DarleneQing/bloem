"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Clock } from "lucide-react";
import type { EnrichedCartItem } from "@/types/carts";
import { ReservationTimer } from "./reservation-timer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CartItemCardProps {
  cartItem: EnrichedCartItem;
  onRemove: (cartItemId: string) => void;
  onExtend: (cartItemId: string) => void;
  isRemoving?: boolean;
  isExtending?: boolean;
}

/**
 * Display single cart item with timer and actions
 */
export function CartItemCard({
  cartItem,
  onRemove,
  onExtend,
  isRemoving = false,
  isExtending = false,
}: CartItemCardProps) {
  const { item, status, can_extend, reservation_count } = cartItem;
  const isExpiring = status === "EXPIRING";
  const isExpired = status === "EXPIRED";

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isExpiring && "border-yellow-500 dark:border-yellow-600",
      isExpired && "border-destructive opacity-60"
    )}>
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        {/* Item Image */}
        <Link
          href={`/items/${item.id}`}
          className="relative w-full sm:w-32 h-40 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted"
        >
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
          {isExpiring && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="bg-yellow-600">
                Expiring Soon
              </Badge>
            </div>
          )}
        </Link>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col h-full">
            {/* Title and Brand */}
            <div className="flex-1">
              <Link
                href={`/items/${item.id}`}
                className="hover:underline"
              >
                <h3 className="font-bold text-lg truncate">{item.title}</h3>
              </Link>
              
              {item.brand && (
                <p className="text-sm text-muted-foreground truncate">
                  {item.brand.name}
                </p>
              )}

              {/* Item Details */}
              <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                <span className="capitalize">{item.category.toLowerCase()}</span>
                {item.size && <span>• {item.size.name}</span>}
                {item.condition && (
                  <span>• {item.condition.replace(/_/g, " ")}</span>
                )}
              </div>

              {/* Seller Info */}
              {item.owner && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sold by {item.owner.first_name} {item.owner.last_name}
                </p>
              )}
            </div>

            {/* Timer and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <ReservationTimer
                expiresAt={cartItem.expires_at}
                status={status}
              />

              <div className="flex items-center gap-2">
                {/* Extend Button */}
                {can_extend && isExpiring && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onExtend(cartItem.id)}
                    disabled={isExtending || isExpired}
                    className="text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Extend Time
                  </Button>
                )}

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(cartItem.id)}
                  disabled={isRemoving}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>

            {/* Extension Info */}
            {reservation_count > 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                Extended {reservation_count - 1} time{reservation_count > 2 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex sm:flex-col items-end sm:items-end justify-between sm:justify-start gap-2">
          {item.selling_price && (
            <p className="font-bold text-xl text-primary">
              CHF {item.selling_price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

