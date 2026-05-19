"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, QrCode, ShoppingCart, Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AddToCartNextStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle: string;
  variant?: "added" | "already_in_cart";
}

export function AddToCartNextStepDialog({
  open,
  onOpenChange,
  itemTitle,
  variant = "added",
}: AddToCartNextStepDialogProps) {
  const router = useRouter();

  const title =
    variant === "already_in_cart" ? "Already in your cart" : "Added to cart";
  const description =
    variant === "already_in_cart"
      ? `${itemTitle} is already reserved in your cart. What would you like to do next?`
      : `${itemTitle} is reserved for 15 minutes. What would you like to do next?`;

  function close() {
    onOpenChange(false);
  }

  function goToScan() {
    close();
    router.push("/scan");
  }

  function goToCart() {
    close();
    router.push("/checkout");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 sm:max-w-md">
        <DialogHeader className="space-y-3 pb-4 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-accent/25 text-primary">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-start gap-3"
            onClick={close}
          >
            <Store className="h-4 w-4 shrink-0" aria-hidden />
            Continue shopping
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-start gap-3"
            onClick={goToScan}
          >
            <QrCode className="h-4 w-4 shrink-0" aria-hidden />
            Scan another QR code
          </Button>
          <Button
            type="button"
            variant="accent"
            className="h-11 w-full justify-start gap-3"
            onClick={goToCart}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
            Go to cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
