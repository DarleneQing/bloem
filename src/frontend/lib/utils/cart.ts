// Cart utility functions

import {
  EXPIRING_THRESHOLD_MS,
  MAX_RESERVATION_EXTENSIONS,
  type CartItemStatus,
  type EnrichedCartItem,
} from "@/types/carts";

/**
 * Calculate time remaining until cart item expires
 * @param expiresAt - ISO timestamp when reservation expires
 * @returns Milliseconds remaining (can be negative if expired)
 */
export function calculateTimeRemaining(expiresAt: string): number {
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  return expiryTime - now;
}

/**
 * Format time remaining as MM:SS
 * @param ms - Milliseconds remaining
 * @returns Formatted string like "14:32" or "0:00"
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Get cart item status based on expiry time
 * @param expiresAt - ISO timestamp when reservation expires
 * @returns CartItemStatus
 */
export function getCartItemStatus(expiresAt: string): CartItemStatus {
  const timeRemaining = calculateTimeRemaining(expiresAt);
  
  if (timeRemaining <= 0) return "EXPIRED";
  if (timeRemaining <= EXPIRING_THRESHOLD_MS) return "EXPIRING";
  return "ACTIVE";
}

/**
 * Check if reservation can be extended
 * @param reservationCount - Current number of reservations (1 = initial, 2 = extended once, etc.)
 * @param expiresAt - ISO timestamp when reservation expires
 * @returns true if extension is allowed
 */
export function canExtendReservation(
  reservationCount: number,
  expiresAt: string
): boolean {
  // Can't extend if already at max extensions
  if (reservationCount >= MAX_RESERVATION_EXTENSIONS + 1) return false;
  
  // Can't extend if already expired
  const timeRemaining = calculateTimeRemaining(expiresAt);
  if (timeRemaining <= 0) return false;
  
  return true;
}

/**
 * Calculate total price of cart items
 * @param items - Array of enriched cart items
 * @returns Total price in currency units
 */
export function calculateCartTotal(items: EnrichedCartItem[]): number {
  return items.reduce((total, cartItem) => {
    const price = cartItem.item.selling_price || 0;
    return total + price;
  }, 0);
}

/**
 * Calculate platform fee (10% of total)
 * @param subtotal - Subtotal amount
 * @returns Platform fee amount
 */
export function calculatePlatformFee(subtotal: number): number {
  return subtotal * 0.1;
}

/**
 * Check if any items are expiring soon
 * @param items - Array of enriched cart items
 * @returns true if any items are in EXPIRING status
 */
export function hasExpiringItems(items: EnrichedCartItem[]): boolean {
  return items.some((item) => item.status === "EXPIRING");
}

/**
 * Check if any items have expired
 * @param items - Array of enriched cart items
 * @returns true if any items are in EXPIRED status
 */
export function hasExpiredItems(items: EnrichedCartItem[]): boolean {
  return items.some((item) => item.status === "EXPIRED");
}

/**
 * Filter out expired items from cart
 * @param items - Array of enriched cart items
 * @returns Array with only active and expiring items
 */
export function filterActiveItems(
  items: EnrichedCartItem[]
): EnrichedCartItem[] {
  return items.filter((item) => item.status !== "EXPIRED");
}

