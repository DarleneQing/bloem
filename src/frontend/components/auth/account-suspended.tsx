"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ACCOUNT_SUSPENDED_MESSAGE } from "@/lib/auth/suspension";
import { createClient } from "@/lib/supabase/client";

export function AccountSuspended() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-foreground">Account suspended</h1>
      <p className="mt-3 text-sm text-muted-foreground">{ACCOUNT_SUSPENDED_MESSAGE}</p>
      <Button type="button" variant="outline" className="mt-6" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
