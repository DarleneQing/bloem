"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { marketUpdateSchema, type MarketUpdateInput } from "@/lib/validations/schemas";
import { Edit, Calendar, MapPin, Users, Euro, AlertCircle, Save, Package } from "lucide-react";
import { MarketPictureUpload } from "./MarketPictureUpload";
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
  policy?: {
    unlimitedHangersPerSeller: boolean;
    maxHangersPerSeller: number;
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
  // Parse address back into individual fields
  const parseAddress = (address: string) => {
    // Format: "streetNumber streetName, zipCode city, country"
    // Or existing format without locationName
    const parts = address.split(", ");
    
    if (parts.length >= 3) {
      const streetPart = parts[0].trim(); // "101 Rämistrasse"
      const cityPart = parts[1].trim(); // "8092 Zürich"
      const country = parts[2].trim(); // "Switzerland"
      
      // Parse street (number and name)
      const streetMatch = streetPart.match(/^(\d+)\s+(.+)$/);
      const streetNumber = streetMatch ? streetMatch[1] : "";
      const streetName = streetMatch ? streetMatch[2] : streetPart;
      
      // Parse city (zipCode and city)
      const cityMatch = cityPart.match(/^(\d+)\s+(.+)$/);
      const zipCode = cityMatch ? cityMatch[1] : "";
      const city = cityMatch ? cityMatch[2] : cityPart;
      
      return { streetName, streetNumber, zipCode, city, country };
    } else if (parts.length === 2) {
      // Fallback: assume first is street, second is city+country
      const cityCountry = parts[1].split(", ");
      return {
        streetName: parts[0].trim(),
        streetNumber: "",
        zipCode: "",
        city: cityCountry[0]?.trim() || "",
        country: cityCountry[1]?.trim() || ""
      };
    } else {
      // Fallback: just street name
      return {
        streetName: address,
        streetNumber: "",
        zipCode: "",
        city: "",
        country: ""
      };
    }
  };

  const parsedAddress = parseAddress(market.location.address);
  
  const [formData, setFormData] = useState<MarketUpdateInput>({
    id: market.id,
    name: market.name,
    description: market.description,
    picture: market.picture || "/assets/images/brand-transparent.png",
    locationName: market.location.name || "",
    streetName: parsedAddress.streetName,
    streetNumber: parsedAddress.streetNumber,
    zipCode: parsedAddress.zipCode,
    city: parsedAddress.city,
    country: parsedAddress.country,
    startDate: market.dates.start,
    endDate: market.dates.end,
    maxSellers: market.capacity.maxVendors,
    maxHangers: market.capacity.maxHangers,
    hangerPrice: market.pricing.hangerPrice
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pictureError, setPictureError] = useState<string | null>(null);
  const [unlimitedHangersPerSeller, setUnlimitedHangersPerSeller] = useState<boolean>(false);
  const [maxHangersPerSeller, setMaxHangersPerSeller] = useState<number>(5);

  // Initialize per-seller policy state from market prop on mount or market change
  useEffect(() => {
    if (market.policy) {
      setUnlimitedHangersPerSeller(Boolean(market.policy.unlimitedHangersPerSeller));
      setMaxHangersPerSeller(
        Number.isFinite(market.policy.maxHangersPerSeller)
          ? market.policy.maxHangersPerSeller
          : 5
      );
    }
  }, [market.policy?.unlimitedHangersPerSeller, market.policy?.maxHangersPerSeller]);

  // Handle input changes
  const handleInputChange = (field: keyof MarketUpdateInput, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };
  
  // Handle picture upload
  const handlePictureChange = (url: string) => {
    setFormData(prev => ({ ...prev, picture: url }));
    setPictureError(null);
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      marketUpdateSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path: (string | number)[]; message: string }> };
        const newErrors: Record<string, string> = {};
        zodError.errors.forEach((err) => {
          const field = err.path[0];
          if (typeof field === 'string') {
            newErrors[field] = err.message;
          }
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
      // Build full address in format: "Rämistrasse 101, 8092 Zürich, Switzerland"
      // Format: "streetNumber streetName, zipCode city, country"
      // Note: locationName is stored separately in location_name field
      const streetPart = `${formData.streetNumber ? `${formData.streetNumber} ` : ""}${formData.streetName}`;
      const cityPart = `${formData.zipCode ? `${formData.zipCode} ` : ""}${formData.city}`;
      const fullAddress = `${streetPart}, ${cityPart}, ${formData.country}`;

      const response = await fetch(`/api/admin/markets/${market.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          location: fullAddress,
          unlimitedHangersPerSeller,
          maxHangersPerSeller
        }),
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
            data.details.forEach((detail: { field: string; message: string }) => {
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

          {/* Market Picture Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Market Picture
            </label>
            <MarketPictureUpload
              value={formData.picture}
              onChange={handlePictureChange}
              disabled={isSubmitting || isReadOnly}
              error={pictureError || errors.picture}
              onUploadError={(error) => setPictureError(error)}
            />
            {errors.picture && (
              <p className="text-sm text-red-600">{errors.picture}</p>
            )}
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <MapPin className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Location</h3>
            </div>

            {/* Location Name */}
            <div className="space-y-2">
              <label htmlFor="locationName" className="text-sm font-medium">
                Location Name
              </label>
              <input
                id="locationName"
                type="text"
                value={formData.locationName}
                onChange={(e) => handleInputChange("locationName", e.target.value)}
                placeholder="e.g., ETH Zürich"
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.locationName ? "border-red-300" : "border-gray-200"
                } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
              />
              {errors.locationName && (
                <p className="text-sm text-red-600">{errors.locationName}</p>
              )}
            </div>

            {/* Street Name */}
            <div className="space-y-2">
              <label htmlFor="streetName" className="text-sm font-medium">
                Street Name *
              </label>
              <input
                id="streetName"
                type="text"
                value={formData.streetName}
                onChange={(e) => handleInputChange("streetName", e.target.value)}
                placeholder="e.g., Rämistrasse"
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.streetName ? "border-red-300" : "border-gray-200"
                } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
              />
              {errors.streetName && (
                <p className="text-sm text-red-600">{errors.streetName}</p>
              )}
            </div>

            {/* Street Number and Zip Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="streetNumber" className="text-sm font-medium">
                  Street Number
                </label>
                <input
                  id="streetNumber"
                  type="text"
                  value={formData.streetNumber}
                  onChange={(e) => handleInputChange("streetNumber", e.target.value)}
                  placeholder="e.g., 101"
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.streetNumber ? "border-red-300" : "border-gray-200"
                  } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                />
                {errors.streetNumber && (
                  <p className="text-sm text-red-600">{errors.streetNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="zipCode" className="text-sm font-medium">
                  Zip Code
                </label>
                <input
                  id="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  placeholder="e.g., 8092"
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.zipCode ? "border-red-300" : "border-gray-200"
                  } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-600">{errors.zipCode}</p>
                )}
              </div>
            </div>

            {/* City and Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g., Zürich"
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.city ? "border-red-300" : "border-gray-200"
                  } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                />
                {errors.city && (
                  <p className="text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium">
                  Country *
                </label>
                <input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  placeholder="e.g., Switzerland"
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.country ? "border-red-300" : "border-gray-200"
                  } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                />
                {errors.country && (
                  <p className="text-sm text-red-600">{errors.country}</p>
                )}
              </div>
            </div>

            {/* Map Preview */}
            {(formData.streetName || formData.city || formData.country) && (
              <MapPreview 
                address={`${formData.streetNumber ? `${formData.streetNumber} ` : ""}${formData.streetName}, ${formData.zipCode ? `${formData.zipCode} ` : ""}${formData.city}, ${formData.country}`}
                locationName={formData.locationName}
                height="300px"
              />
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
              <label htmlFor="maxHangers" className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Maximum Hangers
              </label>
              <input
                id="maxHangers"
                type="number"
                min="0"
                max="10000"
                value={formData.maxHangers || ""}
                onChange={(e) => handleInputChange("maxHangers", e.target.value ? parseInt(e.target.value) : undefined)}
                disabled={isReadOnly}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.maxHangers ? "border-red-300" : "border-gray-200"
                } ${isReadOnly ? "bg-gray-50 cursor-not-allowed" : ""}`}
                placeholder="Optional - leave empty for auto-calculation"
              />
              {errors.maxHangers && (
                <p className="text-sm text-red-600">{errors.maxHangers}</p>
              )}
              {!isReadOnly && (
                <p className="text-xs text-muted-foreground">
                  Current hangers: {market.capacity.currentHangers}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="hangerPrice" className="text-sm font-medium flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Hanger Price (CHF)
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

          {/* Per-seller hanger policy */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Per-seller Hanger Policy</label>
            <div className="flex items-center gap-3">
              <input
                id="unlimitedHangersPerSeller"
                type="checkbox"
                checked={unlimitedHangersPerSeller}
                onChange={(e) => setUnlimitedHangersPerSeller(e.target.checked)}
                disabled={isReadOnly}
              />
              <label htmlFor="unlimitedHangersPerSeller" className="text-sm">Unlimited hangers per seller</label>
            </div>
            {!unlimitedHangersPerSeller && (
              <div className="space-y-1">
                <label htmlFor="maxHangersPerSeller" className="text-sm font-medium">Max hangers per seller</label>
                <input
                  id="maxHangersPerSeller"
                  type="number"
                  min={1}
                  value={maxHangersPerSeller}
                  onChange={(e) => setMaxHangersPerSeller(Math.max(1, parseInt(e.target.value) || 5))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}
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
