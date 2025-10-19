import { redirect } from "next/navigation";
import { checkAdminStatus } from "@/features/auth/queries";

export async function AdminGate({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkAdminStatus();

  if (!isAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}

