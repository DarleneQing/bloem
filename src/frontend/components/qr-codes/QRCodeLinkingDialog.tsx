"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeLinkingForm } from "./QRCodeLinkingForm";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import type { MarketReference } from "@/types/markets";

interface QRCodeLinkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedItemId?: string;
}

export function QRCodeLinkingDialog({
  open,
  onOpenChange,
  preselectedItemId,
}: QRCodeLinkingDialogProps) {
  const [markets, setMarkets] = useState<MarketReference[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [showLinkingForm, setShowLinkingForm] = useState(false);

  useEffect(() => {
    if (open) {
      fetchEnrolledMarkets();
    } else {
      // Reset state when dialog closes
      setSelectedMarketId(null);
      setShowLinkingForm(false);
    }
  }, [open]);

  const fetchEnrolledMarkets = async () => {
    setLoadingMarkets(true);
    try {
      const response = await fetch("/api/markets/enrolled");
      const data = await response.json();
      
      if (data.data && data.data.markets) {
        // Transform markets to simple format
        const formattedMarkets: MarketReference[] = data.data.markets.map((market: { id: string; name: string; status: string }) => ({
          id: market.id,
          name: market.name,
          status: market.status,
        }));
        setMarkets(formattedMarkets);
      } else {
        setMarkets([]);
      }
    } catch (err) {
      console.error("Error fetching enrolled markets:", err);
      setMarkets([]);
    } finally {
      setLoadingMarkets(false);
    }
  };

  const handleMarketSelect = (marketId: string) => {
    setSelectedMarketId(marketId);
    setShowLinkingForm(true);
  };

  const handleSuccess = () => {
    // Close dialog after successful linking
    setTimeout(() => {
      onOpenChange(false);
      setSelectedMarketId(null);
      setShowLinkingForm(false);
    }, 2000);
  };

  if (showLinkingForm && selectedMarketId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link QR Code to Item</DialogTitle>
            <DialogDescription>
              Scan a QR code and link it to an item from your wardrobe
            </DialogDescription>
          </DialogHeader>
          <QRCodeLinkingForm
            preselectedItemId={preselectedItemId}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowLinkingForm(false);
              setSelectedMarketId(null);
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link QR Code to Item</DialogTitle>
          <DialogDescription>
            Select a market you&apos;re registered for to link QR codes
          </DialogDescription>
        </DialogHeader>

        {loadingMarkets ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : markets.length === 0 ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">No Market Registration</h3>
                <p className="text-sm text-yellow-800 mb-4">
                  You need to register for a market before you can link QR codes to items. Register for a market to get started.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/markets" onClick={() => onOpenChange(false)}>
                    Browse Markets
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select a market to link QR codes for:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {markets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => handleMarketSelect(market.id)}
                  className="w-full text-left p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors"
                >
                  <div className="font-medium">{market.name}</div>
                  {market.status !== "ACTIVE" && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Status: {market.status}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

