"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2, QrCode } from "lucide-react";
import { getUserCart } from "@/features/carts/queries";
import { removeFromCart, extendReservation } from "@/features/items/actions";
import { StripePaymentForm } from "@/components/stripe/stripe-payment-form";
import type { CartSummary } from "@/types/carts";
import { CheckoutCartItemRow } from "@/components/cart/checkout-cart-item-row";
import {
  CheckoutOrderSummary,
  getCheckoutTotal,
} from "@/components/cart/checkout-order-summary";
import { CheckoutPaymentMethod } from "@/components/cart/checkout-payment-method";
import { EmptyCart } from "@/components/cart/empty-cart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRScanner } from "@/components/qr-codes/QRScanner";
import { useToast } from "@/hooks/use-toast";
import { formatChfPrice } from "@/lib/qr/item-detail-helpers";
import { cn } from "@/lib/utils";

export function CheckoutView() {
  const router = useRouter();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [extendingItems, setExtendingItems] = useState<Set<string>>(new Set());
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const cartData = await getUserCart();
      setCart(cartData);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCart();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchCart]);

  const handleRemove = async (cartItemId: string) => {
    setRemovingItems((prev) => new Set(prev).add(cartItemId));
    try {
      const result = await removeFromCart(cartItemId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart",
        });
        await fetchCart();
      }
    } catch (error) {
      console.error("Remove from cart error:", error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const handleExtend = async (cartItemId: string) => {
    setExtendingItems((prev) => new Set(prev).add(cartItemId));
    try {
      const result = await extendReservation(cartItemId);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Time extended",
          description: "Reservation extended by 15 minutes",
        });
        await fetchCart();
      }
    } catch (error) {
      console.error("Extend reservation error:", error);
      toast({
        title: "Error",
        description: "Failed to extend reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExtendingItems((prev) => {
        const next = new Set(prev);
        next.delete(cartItemId);
        return next;
      });
    }
  };

  const handleQRScan = (qrCode: string) => {
    setIsScanDialogOpen(false);
    router.push(`/qr/${encodeURIComponent(qrCode)}`);
  };

  const handlePay = async () => {
    if (!cart || !termsAccepted) return;

    setIsPaying(true);
    try {
      const validateRes = await fetch("/api/carts/validate", { method: "POST" });
      const validateData = await validateRes.json();

      if (!validateRes.ok || !validateData.valid) {
        toast({
          title: "Cart needs attention",
          description:
            validateData.message ??
            "Some items expired or are no longer available. Edit your cart and try again.",
          variant: "destructive",
        });
        await fetchCart();
        return;
      }

      const res = await fetch("/api/checkout/create-intent", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.clientSecret) {
        toast({
          title: "Payment unavailable",
          description: data.error ?? "Could not start checkout. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading checkout" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[calc(100dvh-8rem)] max-w-lg flex-col px-4 pb-6 pt-4 md:py-6">
        <header className="relative mb-4 flex items-center justify-between border-b border-border pb-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-foreground"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="pointer-events-none absolute inset-x-0 text-center text-xl font-bold text-foreground">
            Your Cart
          </h1>
          <div aria-hidden className="h-10 w-10 shrink-0" />
        </header>
        <EmptyCart
          scanAction={
            <ScanQrDialog
              open={isScanDialogOpen}
              onOpenChange={setIsScanDialogOpen}
              onScan={handleQRScan}
              className="h-12 w-full gap-2 rounded-full border-2 border-primary text-base font-semibold text-primary hover:bg-primary/5"
            />
          }
        />
      </div>
    );
  }

  const totalAmount = getCheckoutTotal(cart);
  const payLabel = formatChfPrice(totalAmount) ?? "CHF 0.00";
  const canPay =
    termsAccepted &&
    !cart.has_expired_items &&
    !isPaying &&
    !clientSecret &&
    cart.total_items > 0;

  return (
    <div className="container mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6 md:pb-8 md:pt-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
      </header>

      {cart.has_expiring_items && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Some reservations are ending soon. Extend them in Edit mode or they will be removed.
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="checkout-cart-heading">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2
            id="checkout-cart-heading"
            className="text-base font-bold text-foreground"
          >
            Your Cart ({cart.total_items})
          </h2>
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 text-sm font-semibold text-primary"
            onClick={() => setIsEditing((value) => !value)}
          >
            {isEditing ? "Done" : "Edit"}
          </Button>
        </div>

        <div className="divide-y divide-border rounded-2xl border bg-card p-4 shadow-sm">
          {cart.items.map((cartItem) => (
            <CheckoutCartItemRow
              key={cartItem.id}
              cartItem={cartItem}
              isEditing={isEditing}
              isRemoving={removingItems.has(cartItem.id)}
              isExtending={extendingItems.has(cartItem.id)}
              onRemove={handleRemove}
              onExtend={handleExtend}
            />
          ))}
        </div>
      </section>

      <CheckoutOrderSummary cart={cart} />

      {!clientSecret ? (
        <CheckoutPaymentMethod />
      ) : (
        <section className="rounded-2xl border bg-card p-4 shadow-sm">
          <StripePaymentForm
            clientSecret={clientSecret}
            amountLabel={payLabel}
            returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/checkout/success`}
            onError={(message) =>
              toast({
                title: "Payment failed",
                description: message,
                variant: "destructive",
              })
            }
          />
        </section>
      )}

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-foreground">
        <Checkbox
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          className="mt-0.5 rounded border-primary data-[state=checked]:bg-primary"
          aria-describedby="checkout-terms"
        />
        <span id="checkout-terms">
          I agree to the{" "}
          <Link href="#" className="font-semibold text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="font-semibold text-primary hover:underline">
            Refund Policy
          </Link>
          .
        </span>
      </label>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t bg-card/95 px-4 py-3 backdrop-blur md:static md:bottom-auto md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button
          type="button"
          size="lg"
          disabled={!canPay}
          className={cn(
            "h-12 w-full rounded-full text-base font-bold shadow-md",
            !canPay && "opacity-60"
          )}
          onClick={handlePay}
        >
          {isPaying ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing…
            </>
          ) : (
            `Pay ${payLabel}`
          )}
        </Button>
        {!termsAccepted && cart.total_items > 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Accept the terms to continue
          </p>
        )}
        {cart.has_expired_items && (
          <p className="mt-2 text-center text-xs text-destructive">
            Remove expired items before paying
          </p>
        )}
      </div>

      <div className="hidden md:block">
        <ScanQrDialog
          open={isScanDialogOpen}
          onOpenChange={setIsScanDialogOpen}
          onScan={handleQRScan}
          className="w-full"
        />
      </div>
    </div>
  );
}

function ScanQrDialog({
  open,
  onOpenChange,
  onScan,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
  className?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn("gap-2", className)}
        >
          <QrCode className="h-4 w-4 shrink-0" />
          Scan QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <div className="space-y-4 p-6">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at the QR code on an item to view its details
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 pb-6">
          <QRScanner
            onScan={onScan}
            onCancel={() => onOpenChange(false)}
            title=""
            description=""
            showManualInput
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
