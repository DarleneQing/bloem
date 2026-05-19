import { chfToStripeCents } from "@/lib/stripe/fees";

export interface CartCheckoutLineItemInput {
  itemId: string;
  title: string;
  sellingPrice: number;
}

export type CartCheckoutSessionLineItem = {
  quantity: number;
  price_data: {
    currency: string;
    unit_amount: number;
    product_data: {
      name: string;
    };
  };
};

export function buildCartCheckoutLineItems(
  items: CartCheckoutLineItemInput[]
): CartCheckoutSessionLineItem[] {
  return items.map((row) => ({
    quantity: 1,
    price_data: {
      currency: "chf",
      unit_amount: chfToStripeCents(row.sellingPrice),
      product_data: {
        name: row.title.trim() || "Item",
      },
    },
  }));
}

export function computeCartCheckoutTotalFromItems(
  items: CartCheckoutLineItemInput[]
): number {
  const subtotal = items.reduce((sum, row) => sum + row.sellingPrice, 0);
  return Math.round(subtotal * 100) / 100;
}

/** Bump when Checkout Session create params change (e.g. ui_mode migration). */
const CART_CHECKOUT_IDEMPOTENCY_VERSION = "elements-v2";

export function buildCartCheckoutIdempotencyKey(
  cartId: string,
  cartUpdatedAt: string,
  amountCents: number,
  itemIds: string
): string {
  return `cart-checkout-${CART_CHECKOUT_IDEMPOTENCY_VERSION}-${cartId}-${cartUpdatedAt}-${amountCents}-${itemIds}`;
}
