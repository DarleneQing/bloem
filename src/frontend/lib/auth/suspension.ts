import type { Profile } from "@/types/database";

export function isProfileSuspended(
  profile: Pick<Profile, "suspended_at"> | null | undefined
): boolean {
  return profile?.suspended_at != null;
}

export const ACCOUNT_SUSPENDED_MESSAGE =
  "Your account has been suspended. Contact support if you believe this is a mistake.";
