"use client";

import { StripeSellerOnboarding } from "@/components/profile/stripe-seller-onboarding";
import type { ProfileWithStatus } from "@/types/database";

export function ProfileForm({
  profile,
  embedded = false,
}: {
  profile: ProfileWithStatus;
  embedded?: boolean;
  showActivationForm?: boolean;
  onShowActivationFormChange?: (show: boolean) => void;
}) {
  return (
    <StripeSellerOnboarding profile={profile} embedded={embedded} />
  );
}
