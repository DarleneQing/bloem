"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { marketUpdateSchema, type MarketUpdateInput } from "@/lib/validations/schemas";
import { Edit, Calendar, MapPin, Users, Euro, AlertCircle, Save } from "lucide-react";

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
  createdAt: string;
  updatedAt: string;
}

interface MarketEditFormProps {
  market: Market;
  onSuccess?: (market: Market) => void;
  onCancel?: () => void;
}

export function MarketEditForm({ market, onSuccess, onCancel }: MarketEditFormProps) {
  const [formData, setFormData] = useState<MarketUpdateInput>({
    id: market.id,
    name: market.name,
    description: market.description,
    location: market.location.name,
    startDate: market.dates.start,
    endDate: market.dates.end,
    maxSellers: market.capacity.maxVendors,
    hangerPrice: market.pricing.hangerPrice
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = (field: keyof MarketUpdateInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      marketUpdateSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      if (error.errors) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/admin/markets/${market.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Call success callback with updated market
        if (onSuccess) {
          onSuccess(data.data.market);
        }
      } else {
        setSubmitError(data.error || "Failed to update market");
        if (data.details) {
          // Handle validation errors (array format)
          if (Array.isArray(data.details)) {
            const newErrors: Record<string, string> = {};
            data.details.forEach((detail: any) => {
              newErrors[detail.field] = detail.message;
            });
            setErrors(newErrors);
          }
          // Handle conflict errors (object format) - just show the main error message
          // The details object contains overlappingMarkets info which is already in the error message
        }
      }
    } catch (error) {
      setSubmitError("An error occurred while updating the market");
      console.error("Error updating market:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current date in YYYY-MM-DDTHH:MM format for datetime-local inputs
  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  // Format date for datetime-local input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  // Check if market can be edited based on status
  const canEdit = market.status === "DRAFT" || market.status === "ACTIVE";
  const isReadOnly = !canEdit;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Edit Market
        </CardTitle>
        <CardDescription>
          {isReadOnly 
            ? `This market is ${market.status.toLowerCase()} and cannot be edited.`
            : "Update the market details below."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{submitError}</span>
            </div>
          )}

          {/* Market Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Market Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Spring Fashion Market 2024"
              disabled={isReadOnly}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.name ? "border-red-300" : "border-gray-200"
              } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the market, its focus, and what makes it special... (optional)"
              rows={4}
              disabled={isReadOnly}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                errors.description ? "border-red-300" : "border-gray-200"
              } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location *
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="e.g., Central Park, Amsterdam"
              disabled={isReadOnly}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.location ? "border-red-300" : "border-gray-200"
              } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date & Time *
              </label>
              <input
                id="startDate"
                type="datetime-local"
                value={formData.startDate ? formatDateForInput(formData.startDate) : ""}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                min={getCurrentDateTime()}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.startDate ? "border-red-300" : "border-gray-200"
                } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                End Date & Time *
              </label>
              <input
                id="endDate"
                type="datetime-local"
                value={formData.endDate ? formatDateForInput(formData.endDate) : ""}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                min={formData.startDate || getCurrentDateTime()}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.endDate ? "border-red-300" : "border-gray-200"
                } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Capacity and Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="maxSellers" className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Maximum Sellers
              </label>
              <input
                id="maxSellers"
                type="number"
                min="1"
                max="1000"
                value={formData.maxSellers}
                onChange={(e) => handleInputChange("maxSellers", parseInt(e.target.value) || 50)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.maxSellers ? "border-red-300" : "border-gray-200"
                } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
              />
              {errors.maxSellers && (
                <p className="text-sm text-red-600">{errors.maxSellers}</p>
              )}
              {!isReadOnly && (
                <p className="text-xs text-muted-foreground">
                  Current vendors: {market.capacity.currentVendors}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="hangerPrice" className="text-sm font-medium flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Hanger Price (€)
              </label>
              <input
                id="hangerPrice"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.hangerPrice}
                onChange={(e) => handleInputChange("hangerPrice", parseFloat(e.target.value) || 5.00)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.hangerPrice ? "border-red-300" : "border-gray-200"
                } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
              />
              {errors.hangerPrice && (
                <p className="text-sm text-red-600">{errors.hangerPrice}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || isReadOnly}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Market
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
