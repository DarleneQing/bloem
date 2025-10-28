"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { marketCreationSchema, type MarketCreationInput } from "@/lib/validations/schemas";
import { Calendar, MapPin, Users, Euro, AlertCircle, CheckCircle, Package } from "lucide-react";
import { MarketPictureUpload } from "./MarketPictureUpload";
import { MapPreview } from "./MapPreview";

interface MarketCreationFormProps {
  onSuccess?: (market: any) => void;
  onCancel?: () => void;
}

export function MarketCreationForm({ onSuccess, onCancel }: MarketCreationFormProps) {
  const [formData, setFormData] = useState<MarketCreationInput>({
    name: "",
    description: "",
    locationName: "",
    streetName: "",
    streetNumber: "",
    zipCode: "",
    city: "",
    country: "",
    startDate: "",
    endDate: "",
    maxSellers: 50,
    maxHangers: undefined,
    hangerPrice: 5.00,
    picture: ""
  });
  
  const [pictureError, setPictureError] = useState<string | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle input changes
  const handleInputChange = (field: keyof MarketCreationInput, value: string | number | undefined) => {
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
      marketCreationSchema.parse(formData);
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
      // Build full address in format: "Rämistrasse 101, 8092 Zürich, Switzerland"
      // Format: "streetNumber streetName, zipCode city, country"
      // Note: locationName is stored separately in location_name field
      const streetPart = `${formData.streetNumber ? `${formData.streetNumber} ` : ""}${formData.streetName}`;
      const cityPart = `${formData.zipCode ? `${formData.zipCode} ` : ""}${formData.city}`;
      const fullAddress = `${streetPart}, ${cityPart}, ${formData.country}`;

      // Convert datetime-local format to ISO format for API
      const dataToSend = {
        ...formData,
        location: fullAddress, // Send combined address
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : "",
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : "",
        picture: formData.picture || "/assets/images/brand-transparent.png",
        locationName: formData.locationName || undefined,
      };
      
      const response = await fetch("/api/admin/markets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFormData({
          name: "",
          description: "",
          locationName: "",
          streetName: "",
          streetNumber: "",
          zipCode: "",
          city: "",
          country: "",
          startDate: "",
          endDate: "",
          maxSellers: 50,
          hangerPrice: 5.00,
          picture: "/assets/images/brand-transparent.png"
        });
        setErrors({});
        
        // Call success callback
        if (onSuccess) {
          onSuccess(data.data.market);
        }
      } else {
        setSubmitError(data.error || "Failed to create market");
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
      setSubmitError("An error occurred while creating the market");
      console.error("Error creating market:", error);
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

  return (
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.name ? "border-red-300" : "border-gray-200"
              }`}
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                errors.description ? "border-red-300" : "border-gray-200"
              }`}
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
              disabled={isSubmitting}
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
                placeholder="e.g., Zurich HB"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.locationName ? "border-red-300" : "border-gray-200"
                }`}
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
                placeholder="e.g., Bahnhofstrasse"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.streetName ? "border-red-300" : "border-gray-200"
                }`}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.streetNumber ? "border-red-300" : "border-gray-200"
                  }`}
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
                  placeholder="e.g., 8001"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.zipCode ? "border-red-300" : "border-gray-200"
                  }`}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.city ? "border-red-300" : "border-gray-200"
                  }`}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.country ? "border-red-300" : "border-gray-200"
                  }`}
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
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                min={getCurrentDateTime()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.startDate ? "border-red-300" : "border-gray-200"
                }`}
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
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                min={formData.startDate || getCurrentDateTime()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.endDate ? "border-red-300" : "border-gray-200"
                }`}
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.maxSellers ? "border-red-300" : "border-gray-200"
                }`}
              />
              {errors.maxSellers && (
                <p className="text-sm text-red-600">{errors.maxSellers}</p>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.maxHangers ? "border-red-300" : "border-gray-200"
                }`}
                placeholder="Optional - leave empty for auto-calculation"
              />
              {errors.maxHangers && (
                <p className="text-sm text-red-600">{errors.maxHangers}</p>
              )}
              <p className="text-xs text-muted-foreground">
                If empty, will default to 2 hangers per seller
              </p>
            </div>
          </div>

          {/* Pricing */}
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.hangerPrice ? "border-red-300" : "border-gray-200"
              }`}
            />
            {errors.hangerPrice && (
              <p className="text-sm text-red-600">{errors.hangerPrice}</p>
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
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Create Market
                </>
              )}
            </Button>
          </div>
        </form>
  );
}
