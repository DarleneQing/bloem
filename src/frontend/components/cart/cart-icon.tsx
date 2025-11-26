"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { getCartItemCount } from "@/features/items/queries";

/**
 * Cart icon with badge showing item count
 * Displays in navigation bar
 */
export function CartIcon() {
  const [itemCount, setItemCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cart item count
  const fetchCartCount = async () => {
    try {
      const count = await getCartItemCount();
      setItemCount(count);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCartCount();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCartCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-accent transition-colors"
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="h-6 w-6 text-foreground" />
      
      {!isLoading && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-primary rounded-full">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Link>
  );
}


