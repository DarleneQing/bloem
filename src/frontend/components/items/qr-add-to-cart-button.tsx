"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addToCart } from "@/features/items/actions";
import { AddToCartNextStepDialog } from "@/components/cart/add-to-cart-next-step-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface QRAddToCartButtonProps {
  itemId: string;
  itemStatus: string;
  itemTitle: string;
  priceLabel?: string | null;
  layout?: "default" | "sticky";
  inCurrentUserCart?: boolean;
}

export function QRAddToCartButton({
  itemId,
  itemStatus,
  itemTitle,
  priceLabel,
  layout = "default",
  inCurrentUserCart = false,
}: QRAddToCartButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [nextStepOpen, setNextStepOpen] = useState(false);
  const [nextStepVariant, setNextStepVariant] = useState<"added" | "already_in_cart">(
    "added"
  );
  const [localInCart, setLocalInCart] = useState(false);

  const inMyCart = inCurrentUserCart || localInCart;

  const canAddToCart = itemStatus === "RACK";
  const isReservedByOther = itemStatus === "RESERVED" && !inMyCart;
  const isSold = itemStatus === "SOLD";

  const handleAddToCart = async () => {
    setIsAddingToCart(true);

    try {
      const result = await addToCart(itemId);

      if (result.error) {
        if (result.error === "This item is already in a cart") {
          setLocalInCart(true);
          setNextStepVariant("already_in_cart");
          setNextStepOpen(true);
        } else {
          toast({
            title: "Unable to Add to Cart",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        setLocalInCart(true);
        setNextStepVariant("added");
        setNextStepOpen(true);
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      const errorMessage =
        error instanceof Error
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

  const nextStepDialog = (
    <AddToCartNextStepDialog
      open={nextStepOpen}
      onOpenChange={setNextStepOpen}
      itemTitle={itemTitle}
      variant={nextStepVariant}
    />
  );

  if (inMyCart) {
    const viewCartButton =
      layout === "sticky" ? (
        <Button
          onClick={() => router.push("/checkout")}
          className="h-14 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
          size="lg"
        >
          <span className="flex w-full items-center justify-between gap-4 px-1">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              View cart
            </span>
            {priceLabel ? (
              <span className="text-base font-bold tabular-nums">{priceLabel}</span>
            ) : null}
          </span>
        </Button>
      ) : (
        <Button onClick={() => router.push("/checkout")} className="w-full" size="lg">
          <ShoppingCart className="h-4 w-4 mr-2" />
          View cart
        </Button>
      );

    return (
      <>
        {viewCartButton}
        {nextStepDialog}
      </>
    );
  }

  if (isReservedByOther) {
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

  if (layout === "sticky") {
    return (
      <>
        <Button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className="h-14 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
          size="lg"
        >
          {isAddingToCart ? (
            <span className="flex w-full items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Adding...
            </span>
          ) : (
            <span className="flex w-full items-center justify-between gap-4 px-1">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </span>
              {priceLabel ? (
                <span className="text-base font-bold tabular-nums">{priceLabel}</span>
              ) : null}
            </span>
          )}
        </Button>
        {nextStepDialog}
      </>
    );
  }

  return (
    <>
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
      {nextStepDialog}
    </>
  );
}
