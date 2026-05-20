"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { updateMarketingConsent } from "@/features/marketing/actions";
import { cn } from "@/lib/utils";

interface NewsletterToggleProps {
  initialConsent: boolean;
}

export function NewsletterToggle({ initialConsent }: NewsletterToggleProps) {
  const [subscribed, setSubscribed] = useState(initialConsent);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateMarketingConsent({ consent: checked });

      if ("error" in result) {
        setError(result.error ?? "Failed to update preference");
        setTimeout(() => setError(null), 5000);
        return;
      }

      setSubscribed(result.data.consent);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <label
            htmlFor="newsletter-toggle"
            className="text-base font-bold leading-snug text-foreground"
          >
            Newsletter
          </label>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {subscribed
              ? "You'll receive bloem updates about new markets and seller opportunities."
              : "You won't receive marketing emails from bloem."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 pt-0.5">
          <span
            className={cn(
              "text-sm font-medium",
              subscribed ? "text-primary" : "text-muted-foreground"
            )}
          >
            {subscribed ? "Subscribed" : "Unsubscribed"}
          </span>
          <Switch
            id="newsletter-toggle"
            checked={subscribed}
            onCheckedChange={handleToggle}
            disabled={pending}
            className="shrink-0"
            aria-label={`${subscribed ? "Unsubscribe from" : "Subscribe to"} bloem newsletter`}
          />
        </div>
      </div>

      {success && (
        <p className="rounded-lg border border-brand-accent/30 bg-brand-accent/15 px-3 py-2 text-sm text-foreground">
          Preference saved.
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        We only use this list for marketing emails — transactional messages
        (order confirmations, payout notices) are sent regardless of this
        setting. You can unsubscribe at any time using the link in any
        marketing email.
      </p>
    </div>
  );
}
