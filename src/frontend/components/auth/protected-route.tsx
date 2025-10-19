import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/queries";

export async function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return <>{children}</>;
}

