import { createClient } from "@/lib/supabase/server";
import type { ProfileWithStatus } from "@/types/database";

// Get current user profile with seller status
export async function getUserProfile(): Promise<ProfileWithStatus | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  // Add computed property
  const profileWithStatus: ProfileWithStatus = {
    ...profile,
    isActiveSeller: profile.iban_verified_at !== null,
  };

  return profileWithStatus;
}

// Check if current user is active seller
export async function checkSellerStatus(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.isActiveSeller ?? false;
}

// Check if current user is admin
export async function checkAdminStatus(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "ADMIN";
}

// Get current user (auth user only)
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

