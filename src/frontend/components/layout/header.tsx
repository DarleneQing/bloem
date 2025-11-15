"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getCartItemCount } from "@/features/items/queries";

export function Header() {
  const [itemCount, setItemCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cart item count
  useEffect(() => {
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

    fetchCartCount();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchCartCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="hidden md:block sticky top-0 z-40 border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <Image
            src="/assets/images/logo-transparent.png"
            alt="Bloem"
            width={140}
            height={40}
            className="h-9 md:h-11 w-auto"
            priority
          />
        </Link>
        
        {/* Desktop navigation - hidden on mobile since we have bottom nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/explore" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Explore
          </Link>
          <Link 
            href="/markets" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Markets
          </Link>
          <Link 
            href="/wardrobe" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Wardrobe
          </Link>
          <Link 
            href="/cart" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative flex items-center gap-2"
            aria-label={`Shopping cart with ${itemCount} items`}
          >
            <span>Cart</span>
            {!isLoading && itemCount > 0 && (
              <span className="flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-primary rounded-full">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>
          <Link 
            href="/profile" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}

