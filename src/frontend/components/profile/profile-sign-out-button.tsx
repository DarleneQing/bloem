"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "@/features/auth/actions";

function SignOutButtonInner() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl border border-destructive/30 bg-card py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-60"
    >
      {pending ? "Signing out…" : "Log Out"}
    </button>
  );
}

export function ProfileSignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutButtonInner />
    </form>
  );
}
