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
      className="w-full sm:w-auto"
      disabled={pending}
    >
      {pending ? "Signing out..." : "Sign Out"}
    </Button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutButtonInner />
    </form>
  );
}

