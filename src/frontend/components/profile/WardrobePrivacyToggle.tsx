"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { wardrobePrivacyToggleSchema, type WardrobePrivacyToggleInput } from "@/lib/validations/schemas";
import type { ProfileWithStatus } from "@/types/database";
import { cn } from "@/lib/utils";

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
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <label
            htmlFor="wardrobe-privacy-toggle"
            className="text-base font-bold leading-snug text-foreground"
          >
            Wardrobe Privacy
          </label>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isPublic
              ? "Your wardrobe is visible to other users"
              : "Your wardrobe is private and only visible to you"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
          <span
            className={cn(
              "text-sm font-medium",
              isPublic ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isPublic ? "Public" : "Private"}
          </span>
          <Switch
            id="wardrobe-privacy-toggle"
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={loading}
            className="shrink-0"
            aria-label={`Toggle wardrobe privacy to ${isPublic ? "private" : "public"}`}
          />
        </div>
      </div>

      {success && (
        <p className="rounded-lg border border-brand-accent/30 bg-brand-accent/15 px-3 py-2 text-sm text-foreground">
          Wardrobe privacy updated.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        When public, other users can view your wardrobe items when you share your profile link.
        When private, only you can see your wardrobe items.
      </p>
    </div>
  );
}
