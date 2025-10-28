"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { wardrobePrivacyToggleSchema, type WardrobePrivacyToggleInput } from "@/lib/validations/schemas";
import type { ProfileWithStatus } from "@/types/database";

interface WardrobePrivacyToggleProps {
  profile: ProfileWithStatus;
}

export function WardrobePrivacyToggle({ profile }: WardrobePrivacyToggleProps) {
  const [isPublic, setIsPublic] = useState(profile.wardrobe_status === "PUBLIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data: WardrobePrivacyToggleInput = { public: checked };
      const validated = wardrobePrivacyToggleSchema.parse(data);

      const response = await fetch("/api/user/wardrobe-privacy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update wardrobe privacy");
      }

      setIsPublic(checked);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <label 
            htmlFor="wardrobe-privacy-toggle"
            className="text-base font-medium text-foreground"
          >
            Wardrobe Privacy
          </label>
          <p className="text-sm text-muted-foreground">
            {isPublic 
              ? "Your wardrobe is visible to other users" 
              : "Your wardrobe is private and only visible to you"
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${isPublic ? 'text-purple-600' : 'text-gray-500'}`}>
            {isPublic ? 'Public' : 'Private'}
          </span>
          <Switch
            id="wardrobe-privacy-toggle"
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={loading}
            className="min-h-touch min-w-touch"
            aria-label={`Toggle wardrobe privacy to ${isPublic ? "private" : "public"}`}
          />
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-800">
            ✓ Wardrobe privacy updated successfully
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">
            ⚠ {error}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="mt-2 h-auto p-1 text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        When public, other users can view your wardrobe items when you share your profile link.
        When private, only you can see your wardrobe items.
      </div>
    </div>
  );
}
