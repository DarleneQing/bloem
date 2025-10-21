"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Play, 
  Pause, 
  XCircle
} from "lucide-react";

// Types for market data
interface Market {
  id: string;
  name: string;
  description: string;
  location: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  dates: {
    start: string;
    end: string;
  };
  capacity: {
    maxVendors: number;
    currentVendors: number;
    availableSpots: number;
    maxHangers: number;
    currentHangers: number;
    availableHangers: number;
  };
  pricing: {
    hangerPrice: number;
  };
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  statistics?: {
    totalHangersRented: number;
    totalItems: number;
    totalRentals: number;
    totalTransactions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type MarketAction = "delete" | "activate" | "deactivate" | "cancel";

interface MarketConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: Market | null;
  action: MarketAction | null;
  onConfirm: (marketId: string, action: MarketAction) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function MarketConfirmationDialog({
  open,
  onOpenChange,
  market,
  action,
  onConfirm,
  isLoading = false,
  error = null,
}: MarketConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!market || !action) {
    return null;
  }

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(market.id, action);
      onOpenChange(false);
    } catch (err) {
      // Error handling is done by parent component
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionConfig = (action: MarketAction) => {
    const configs = {
      delete: {
        title: "Delete Market",
        description: `Are you sure you want to delete "${market.name}"? This action cannot be undone.`,
        icon: Trash2,
        actionText: "Delete",
        variant: "destructive" as const,
        iconColor: "text-red-600",
        iconBg: "bg-red-100",
      },
      activate: {
        title: "Activate Market",
        description: `Are you sure you want to activate "${market.name}"? This will make it visible to vendors and start accepting registrations.`,
        icon: Play,
        actionText: "Activate",
        variant: "default" as const,
        iconColor: "text-green-600",
        iconBg: "bg-green-100",
      },
      deactivate: {
        title: "Deactivate Market",
        description: `Are you sure you want to deactivate "${market.name}"? This will close registration but keep the market as draft for future activation.`,
        icon: Pause,
        actionText: "Deactivate",
        variant: "secondary" as const,
        iconColor: "text-yellow-600",
        iconBg: "bg-yellow-100",
      },
      cancel: {
        title: "Cancel Market",
        description: `Are you sure you want to cancel "${market.name}"? This action cannot be undone and will notify all registered sellers.`,
        icon: XCircle,
        actionText: "Cancel Market",
        variant: "destructive" as const,
        iconColor: "text-red-600",
        iconBg: "bg-red-100",
      },
    };

    return configs[action];
  };

  const config = getActionConfig(action);
  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md max-w-[90vw]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${config.iconBg}`}>
              <Icon className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <AlertDialogTitle className="text-left">
              {config.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isProcessing || isLoading} className="w-full sm:w-auto">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={config.variant}
              onClick={handleConfirm}
              disabled={isProcessing || isLoading}
              className="w-full sm:w-auto"
            >
              {isProcessing || isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </>
              ) : (
                config.actionText
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
