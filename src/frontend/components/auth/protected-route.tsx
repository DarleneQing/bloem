import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUserServer } from "@/lib/auth/utils";

export async function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserServer();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return <>{children}</>;
}

