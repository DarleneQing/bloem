import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUserServer, getUserProfileServer } from "@/lib/auth/utils";
import { isProfileSuspended } from "@/lib/auth/suspension";
import { AccountSuspended } from "@/components/auth/account-suspended";

export async function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const profile = await getUserProfileServer(user.id);
  if (profile && isProfileSuspended(profile) && profile.role !== "ADMIN") {
    return <AccountSuspended />;
  }

  return <>{children}</>;
}

