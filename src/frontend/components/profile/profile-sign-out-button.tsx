"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

function SignOutButtonInner() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="h-12 w-full rounded-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
    >
      {pending ? "Signing out…" : "Log Out"}
    </Button>
  );
}

export function ProfileSignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutButtonInner />
    </form>
  );
}
