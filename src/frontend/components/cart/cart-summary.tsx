"use client";

import Link from "next/link";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import type { CartSummary } from "@/types/carts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculatePlatformFee } from "@/lib/utils/cart";

interface CartSummaryProps {
  cart: CartSummary;
}

/**
 * Cart summary with totals and checkout button
 */
export function CartSummaryComponent({ cart }: CartSummaryProps) {
  const { total_items, total_price, has_expiring_items } = cart;
  
  const platformFee = calculatePlatformFee(total_price);
  const totalAmount = total_price + platformFee;
  
  const hasItems = total_items > 0;
  const canCheckout = hasItems && !has_expiring_items;

  return (
    <Card className="p-6 sticky top-4">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      {/* Item Count */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Items ({total_items})</span>
          <span className="font-medium">CHF {total_price.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Platform Fee (10%)</span>
          <span className="font-medium">CHF {platformFee.toFixed(2)}</span>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg text-primary">
              CHF {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Warning for Expiring Items */}
      {has_expiring_items && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Some items are expiring soon. Extend their reservation or they will be removed from your cart.
          </AlertDescription>
        </Alert>
      )}

      {/* Checkout Button */}
      <Button
        asChild={canCheckout}
        disabled={!canCheckout}
        className="w-full"
        size="lg"
      >
        {canCheckout ? (
          <Link href="/checkout">
            <ShoppingBag className="h-5 w-5 mr-2" />
            Proceed to Checkout
          </Link>
        ) : (
          <span>
            <ShoppingBag className="h-5 w-5 mr-2" />
            {!hasItems ? "Cart is Empty" : "Resolve Issues to Checkout"}
          </span>
        )}
      </Button>

      {/* Additional Info */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>Secure checkout powered by Stripe</p>
        <p className="mt-1">Items are reserved for 15 minutes</p>
      </div>
    </Card>
  );
}

