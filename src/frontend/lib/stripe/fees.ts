/** Platform commission rate (10%) — keep in sync with lib/utils/cart calculatePlatformFee */

export const PLATFORM_FEE_RATE = 0.1;

export const MIN_PAYOUT_AMOUNT_CHF = 10;

export interface FeeBreakdown {
  totalAmount: number;
  platformFee: number;
  sellerAmount: number;
}

export function computePurchaseFees(itemPrice: number): FeeBreakdown {
  const totalAmount = roundChf(itemPrice);
  const platformFee = roundChf(totalAmount * PLATFORM_FEE_RATE);
  const sellerAmount = roundChf(totalAmount - platformFee);
  return { totalAmount, platformFee, sellerAmount };
}

export function computeCartCheckoutTotal(subtotal: number): number {
  return roundChf(subtotal + roundChf(subtotal * PLATFORM_FEE_RATE));
}

export function chfToStripeCents(amountChf: number): number {
  return Math.round(amountChf * 100);
}

export function stripeCentsToChf(cents: number): number {
  return roundChf(cents / 100);
}

function roundChf(value: number): number {
  return Math.round(value * 100) / 100;
}
