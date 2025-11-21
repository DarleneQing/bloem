"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUserCart } from "@/features/items/queries";
import { removeFromCart, extendReservation } from "@/features/items/actions";
import type { CartSummary } from "@/types/carts";
import { CartItemCard } from "@/components/cart/cart-item-card";
import { CartSummaryComponent } from "@/components/cart/cart-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QRScanner } from "@/components/qr-codes/QRScanner";

/**
 * Shopping cart page
 * Shows all cart items with reservation timers and management actions
 */
export default function CartPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [extendingItems, setExtendingItems] = useState<Set<string>>(new Set());
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);

  // Fetch cart data
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

  // Initial fetch
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCart();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchCart]);

  // Handle remove item
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
        // Refresh cart
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

  // Handle extend reservation
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
        // Refresh cart
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

  // Handle QR code scan - navigate to QR code page with full item details
  const handleQRScan = (qrCode: string) => {
    // Close dialog and navigate to /qr/[code] page which shows full item details
    setIsScanDialogOpen(false);
    router.push(`/qr/${encodeURIComponent(qrCode)}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <Dialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <QrCode className="h-4 w-4" />
                Scan QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0">
              <div className="p-6 space-y-4">
                <DialogHeader>
                  <DialogTitle>Scan QR Code</DialogTitle>
                  <DialogDescription>
                    Point your camera at the QR code on an item to view its details
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="px-6 pb-6">
                <QRScanner
                  onScan={handleQRScan}
                  onCancel={() => setIsScanDialogOpen(false)}
                  title=""
                  description=""
                  showManualInput={true}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {cart.total_items} {cart.total_items === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        <Dialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <QrCode className="h-4 w-4" />
              Scan QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-0">
            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle>Scan QR Code</DialogTitle>
                <DialogDescription>
                  Point your camera at the QR code on an item to view its details
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-6 pb-6">
              <QRScanner
                onScan={handleQRScan}
                onCancel={() => setIsScanDialogOpen(false)}
                title=""
                description=""
                showManualInput={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Expiring Items Warning */}
      {cart.has_expiring_items && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some items in your cart are expiring soon. Extend their reservation time or they will be automatically removed.
          </AlertDescription>
        </Alert>
      )}

      {/* Cart Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((cartItem) => (
            <CartItemCard
              key={cartItem.id}
              cartItem={cartItem}
              onRemove={handleRemove}
              onExtend={handleExtend}
              isRemoving={removingItems.has(cartItem.id)}
              isExtending={extendingItems.has(cartItem.id)}
            />
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <CartSummaryComponent cart={cart} />
        </div>
      </div>
    </div>
  );
}

