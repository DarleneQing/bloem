"use client";

import type { CartSummary } from "@/types/carts";
import { formatChfPrice } from "@/lib/qr/item-detail-helpers";

interface CheckoutOrderSummaryProps {
  cart: CartSummary;
}

export function CheckoutOrderSummary({ cart }: CheckoutOrderSummaryProps) {
  const { total_items, total_price } = cart;
  const hangerFee = 0;

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <h2 className="mb-4 text-base font-bold text-foreground">Order Summary</h2>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Items ({total_items})</dt>
          <dd className="font-medium text-foreground">
            {formatChfPrice(total_price)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Hanger Fee (incl. in items)</dt>
          <dd className="font-medium text-foreground">
            {formatChfPrice(hangerFee)}
          </dd>
        </div>
      </dl>

      <div className="my-4 border-t border-border" />

      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-foreground">Total</span>
        <span className="text-lg font-bold text-primary">
          {formatChfPrice(total_price)}
        </span>
      </div>

      <p className="sr-only">Total amount {total_price}</p>
    </section>
  );
}

export function getCheckoutTotal(cart: CartSummary): number {
  return cart.total_price;
}
