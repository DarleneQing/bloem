// Cart-related types from database schema

import type { Item } from "./items";

export type CartItemStatus = "ACTIVE" | "EXPIRING" | "EXPIRED";

// Cart table
export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Cart Items table
export interface CartItem {
  id: string;
  cart_id: string;
  item_id: string;
  reserved_at: string;
  expires_at: string;
  reservation_count: number;
  last_extended_at: string | null;
  auto_removed: boolean;
  created_at: string;
}

// Enriched cart item with full item details and computed fields
export interface EnrichedCartItem extends CartItem {
  item: Item & {
    brand?: { id: string; name: string } | null;
    size?: { id: string; name: string } | null;
    color?: { id: string; name: string; hex_code: string | null } | null;
    owner?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  // Computed fields
  status: CartItemStatus;
  time_remaining_ms: number;
  can_extend: boolean;
}

// Cart summary with all items and totals
export interface CartSummary {
  cart: Cart;
  items: EnrichedCartItem[];
  total_items: number;
  total_price: number;
  has_expiring_items: boolean;
  has_expired_items: boolean;
}

// Input types for actions
export interface AddToCartInput {
  itemId: string;
}

export interface RemoveFromCartInput {
  cartItemId: string;
}

export interface ExtendReservationInput {
  cartItemId: string;
}

// Constants
export const RESERVATION_DURATION_MS = 15 * 60 * 1000; // 15 minutes per extend
export const MAX_TOTAL_RESERVATION_MS = 60 * 60 * 1000; // 1 hour from reserved_at
/** Max extends after initial 15 min block (up to 1 hour total with 15 min steps). */
export const MAX_RESERVATION_EXTENSIONS = 3;
export const EXPIRING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
export const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes


