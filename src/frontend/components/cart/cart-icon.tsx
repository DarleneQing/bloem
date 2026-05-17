"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { getCartItemCount } from "@/features/carts/queries";

const CART_COUNT_CACHE_KEY = "bloem.cart.last_count";

function readCachedCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(CART_COUNT_CACHE_KEY);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Cart icon with badge showing item count. Persists the last known count to
 * localStorage so the badge doesn't flash to zero during the initial fetch.
 */
export function CartIcon() {
  const [itemCount, setItemCount] = useState<number>(() => readCachedCount());

  const fetchCartCount = async () => {
    try {
      const count = await getCartItemCount();
      setItemCount(count);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(CART_COUNT_CACHE_KEY, String(count));
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  useEffect(() => {
    fetchCartCount();
    const interval = setInterval(fetchCartCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/checkout"
      className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-accent transition-colors"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-6 w-6 text-foreground" />

      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-primary rounded-full">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Link>
  );
}
