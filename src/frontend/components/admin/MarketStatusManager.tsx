"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  Calendar,
  Users,
  Euro,
  MapPin,
  Package,
  Edit
} from "lucide-react";
import { MapPreview } from "./MapPreview";

interface Market {
  id: string;
  name: string;
  description: string;
  picture?: string;
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

interface MarketStatusManagerProps {
  market: Market;
  onStatusChange?: (marketId: string, newStatus: string) => void;
  onEdit?: () => void;
  onClose?: () => void;
}

export function MarketStatusManager({ market, onStatusChange, onEdit, onClose }: MarketStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      // Call the parent callback instead of making our own API call
      if (onStatusChange) {
        await onStatusChange(market.id, newStatus);
        
        // Close the modal if provided
        if (onClose) {
          onClose();
        }
      }
    } catch (err) {
      setError("An error occurred while updating market status");
      console.error("Error updating market status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: Market["status"]) => {
    const styles = {
      DRAFT: "bg-gray-100 text-gray-800",
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800"
    };
    
    const icons = {
      DRAFT: AlertCircle,
      ACTIVE: Play,
      COMPLETED: CheckCircle,
      CANCELLED: XCircle
    };

    const Icon = icons[status];
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        <Icon className="h-4 w-4" />
        {status}
      </span>
    );
  };

  // Get available status transitions
  const getAvailableTransitions = (currentStatus: Market["status"]) => {
    const transitions = {
      DRAFT: {
        status: "ACTIVE",
        label: "Activate Market",
        icon: Play,
        description: "Make the market visible to sellers and start accepting registrations",
        variant: "default"
      },
      ACTIVE_DEACTIVATE: {
        status: "DRAFT",
        label: "Deactivate Market",
        icon: Pause,
        description: "Close registration but keep the market as draft for future activation",
        variant: "secondary"
      },
      ACTIVE_CANCEL: {
        status: "CANCELLED",
        label: "Cancel Market",
        icon: XCircle,
        description: "Cancel the market and notify all registered sellers",
        variant: "destructive"
      }
    };

    const availableTransitions = [];
    
    if (currentStatus === "DRAFT") {
      availableTransitions.push(transitions.DRAFT);
    }
    
    if (currentStatus === "ACTIVE") {
      availableTransitions.push(transitions.ACTIVE_DEACTIVATE);
      availableTransitions.push(transitions.ACTIVE_CANCEL);
    }

    return availableTransitions;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Check if market is in the past
  const isPastMarket = new Date(market.dates.end) < new Date();
  const isCurrentMarket = new Date(market.dates.start) <= new Date() && new Date(market.dates.end) >= new Date();
  const isFutureMarket = new Date(market.dates.start) > new Date();

  const availableTransitions = getAvailableTransitions(market.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {market.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Market Picture */}
        {market.picture && (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={market.picture} 
              alt={market.name}
              className="w-full h-48 object-contain rounded-lg border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/assets/images/brand-transparent.png";
              }}
            />
          </div>
        )}

        {/* Current Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Current Status</h3>
            {getStatusBadge(market.status)}
          </div>
          <div className="text-sm text-muted-foreground">
            {market.status === "DRAFT" && "Market is being prepared and not yet visible to sellers"}
            {market.status === "ACTIVE" && "Market is live and accepting seller registrations"}
            {market.status === "COMPLETED" && "Market has finished successfully"}
            {market.status === "CANCELLED" && "Market has been cancelled"}
          </div>
        </div>

        {/* Market Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Market Timeline</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Start:</span>
              <span className={isFutureMarket ? "text-blue-600" : ""}>
                {formatDate(market.dates.start)}
              </span>
              {isFutureMarket && <span className="text-xs text-blue-600">(Future)</span>}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">End:</span>
              <span className={isPastMarket ? "text-gray-500" : ""}>
                {formatDate(market.dates.end)}
              </span>
              {isPastMarket && <span className="text-xs text-gray-500">(Past)</span>}
              {isCurrentMarket && <span className="text-xs text-green-600">(Current)</span>}
            </div>
          </div>
        </div>

        {/* Market Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Market Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Vendors:</span>
              <span>{market.capacity.currentVendors}/{market.capacity.maxVendors}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Hangers:</span>
              <span>{market.capacity.currentHangers}/{market.capacity.maxHangers}</span>
            </div>
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Hanger Price:</span>
              <span>€{market.pricing.hangerPrice}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Created:</span>
              <span>{formatDate(market.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Location Map */}
        {market.location.address && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {market.location.name || "N/A"}</p>
              <p><span className="font-medium">Address:</span> {market.location.address}</p>
            </div>
            <MapPreview 
              address={market.location.address}
              locationName={market.location.name}
              height="300px"
            />
          </div>
        )}

        {/* Status Transitions */}
        {availableTransitions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Available Actions</h3>
            <div className="space-y-2">
              {availableTransitions.map((transition) => {
                const Icon = transition.icon;
                return (
                  <div key={transition.status} className="p-3 border rounded-lg">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{transition.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transition.description}
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant={transition.variant as any}
                          size="sm"
                          onClick={() => handleStatusChange(transition.status)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            transition.label
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Actions Available */}
        {availableTransitions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No status changes available for this market.</p>
            <p className="text-xs mt-1">
              {market.status === "COMPLETED" && "Completed markets cannot be changed."}
              {market.status === "CANCELLED" && "Cancelled markets cannot be changed."}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {(onEdit || onClose) && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Market
              </Button>
            )}
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
