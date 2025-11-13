"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { qrBatchCreationSchema, type QRBatchCreationInput } from "@/features/qr-batches/validations";
import { createQRBatch } from "@/features/qr-batches/actions";
import { AlertCircle, Package } from "lucide-react";

interface QRBatchCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function QRBatchCreationForm({ onSuccess, onCancel }: QRBatchCreationFormProps) {
  const [formData, setFormData] = useState<QRBatchCreationInput>({
    prefix: "",
    codeCount: 100,
    marketId: "" as any, // Will be validated, initial empty string for select
    name: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);

  const handleInputChange = (field: keyof QRBatchCreationInput, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate form data
    const validation = qrBatchCreationSchema.safeParse(formData);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        const path = issue.path.join(".");
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createQRBatch(validation.data);
      
      if (result.error) {
        setSubmitError(result.error);
      } else {
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      setSubmitError("Failed to create QR batch");
      console.error("Error creating QR batch:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch markets for dropdown
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoadingMarkets(true);
        // Try admin endpoint first
        let response = await fetch("/api/admin/markets?limit=100&status=all");
        let data = await response.json();

        if (!(data?.success && data?.data?.markets?.length)) {
          // Fallback to public endpoint (ACTIVE markets)
          response = await fetch("/api/markets?limit=100&status=ACTIVE");
          data = await response.json();
          if (data?.success && data?.data?.markets) {
            setMarkets(
              data.data.markets.map((m: any) => ({
                id: m.id,
                name: m.name,
                status: m.status,
              }))
            );
            return;
          }
        } else {
          setMarkets(
            data.data.markets.map((m: any) => ({
              id: m.id,
              name: m.name,
              status: m.status,
            }))
          );
          return;
        }
      } catch (err) {
        console.error("Error fetching markets:", err);
      } finally {
        setLoadingMarkets(false);
      }
    };
    
    fetchMarkets();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Prefix */}
      <div>
        <label htmlFor="prefix" className="block text-sm font-medium mb-1">
          Prefix *
        </label>
        <input
          id="prefix"
          type="text"
          value={formData.prefix}
          onChange={(e) => handleInputChange("prefix", e.target.value.toUpperCase())}
          placeholder="e.g., MARKET01"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.prefix ? "border-red-500" : "border-gray-300"
          }`}
          maxLength={50}
        />
        {errors.prefix && (
          <p className="mt-1 text-sm text-red-600">{errors.prefix}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Uppercase letters, numbers, hyphens, and underscores only. Format: BLOEM-{formData.prefix || "PREFIX"}-00001
        </p>
      </div>

      {/* Code Count */}
      <div>
        <label htmlFor="codeCount" className="block text-sm font-medium mb-1">
          Number of Codes *
        </label>
        <input
          id="codeCount"
          type="number"
          value={formData.codeCount}
          onChange={(e) => handleInputChange("codeCount", parseInt(e.target.value) || 0)}
          min={1}
          max={500}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.codeCount ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.codeCount && (
          <p className="mt-1 text-sm text-red-600">{errors.codeCount}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Between 1 and 500 codes per batch
        </p>
      </div>

      {/* Market Selection (Required) */}
      <div>
        <label htmlFor="marketId" className="block text-sm font-medium mb-1">
          Market *
        </label>
        {loadingMarkets ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
            Loading markets...
          </div>
        ) : (
          <select
            id="marketId"
            value={formData.marketId}
            onChange={(e) => handleInputChange("marketId", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.marketId ? "border-red-500" : "border-gray-300"
            }`}
            required
          >
            <option value="">Select a market...</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>
                {market.name} {market.status !== "ACTIVE" ? `(${market.status})` : ""}
              </option>
            ))}
          </select>
        )}
        {errors.marketId && (
          <p className="mt-1 text-sm text-red-600">{errors.marketId}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          All QR code batches must be associated with a market.
        </p>
      </div>

      {/* Batch Name (Optional) */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Batch Name (Optional)
        </label>
        <input
          id="name"
          type="text"
          value={formData.name || ""}
          onChange={(e) => handleInputChange("name", e.target.value || null)}
          placeholder="e.g., Spring Market 2024"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          maxLength={100}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Optional descriptive name for this batch
        </p>
      </div>

      {/* Preview */}
      {formData.prefix && formData.codeCount > 0 && (
        <div className="p-4 bg-gray-50 rounded-md">
          <p className="text-sm font-medium mb-2">Preview:</p>
          <p className="text-xs text-muted-foreground font-mono">
            First code: BLOEM-{formData.prefix}-00001
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            Last code: BLOEM-{formData.prefix}-{formData.codeCount.toString().padStart(5, "0")}
          </p>
        </div>
      )}

      {/* Error Display */}
      {submitError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{submitError}</span>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            "Creating..."
          ) : (
            <>
              <Package className="h-4 w-4 mr-2" />
              Create Batch
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

