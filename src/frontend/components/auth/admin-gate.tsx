import React from "react";
import { redirect } from "next/navigation";
import { isAdminServer } from "@/lib/auth/utils";

export async function AdminGate({ children }: { children: React.ReactNode }) {
  const isAdmin = await isAdminServer();

  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}

