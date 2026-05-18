"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { refreshStripeAccountStatus } from "@/features/auth/actions";

export function ProfileStripeReturn() {
  const searchParams = useSearchParams();
  const onboarding = searchParams.get("onboarding");

  useEffect(() => {
    if (onboarding === "return" || onboarding === "refresh") {
      refreshStripeAccountStatus().finally(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("onboarding");
        window.history.replaceState({}, "", url.pathname + url.search);
      });
    }
  }, [onboarding]);

  return null;
}
