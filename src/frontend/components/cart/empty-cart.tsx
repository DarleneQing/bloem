import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Empty cart state
 */
export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
      
      <p className="text-muted-foreground mb-8 max-w-md">
        Browse items at markets to add them to your cart. Items are reserved for 15 minutes once added.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg">
          <Link href="/markets">
            Browse Markets
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="lg">
          <Link href="/wardrobe">
            View My Wardrobe
          </Link>
        </Button>
      </div>
    </div>
  );
}


