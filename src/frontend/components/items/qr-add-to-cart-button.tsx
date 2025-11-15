"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addToCart } from "@/features/items/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface QRAddToCartButtonProps {
  itemId: string;
  itemStatus: string;
  itemTitle: string;
}

export function QRAddToCartButton({ 
  itemId, 
  itemStatus, 
  itemTitle
}: QRAddToCartButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Check if item can be added to cart
  const canAddToCart = itemStatus === "RACK";
  const isReserved = itemStatus === "RESERVED";
  const isSold = itemStatus === "SOLD";

  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    try {
      const result = await addToCart(itemId);

      if (result.error) {
        // Check if item is already in user's cart
        if (result.error === "This item is already in a cart") {
          toast({
            title: "Item Already in Cart",
            description: "This item is already in your cart. Redirecting to cart...",
          });
          // Redirect to cart page to show the item
          setTimeout(() => {
            router.push("/cart");
          }, 1000);
        } else {
          // Show error notification with specific reason
          toast({
            title: "Unable to Add to Cart",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Added to cart",
          description: `${itemTitle} has been added to your cart`,
        });
        // Redirect to cart page
        router.push("/cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      // Show error notification with detailed message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to add item to cart. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isReserved) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>This item is currently reserved by another buyer</AlertDescription>
      </Alert>
    );
  }

  if (isSold) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>This item has been sold</AlertDescription>
      </Alert>
    );
  }

  if (!canAddToCart) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>This item is not available for purchase</AlertDescription>
      </Alert>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAddingToCart}
      className="w-full"
      size="lg"
    >
      {isAddingToCart ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
}

