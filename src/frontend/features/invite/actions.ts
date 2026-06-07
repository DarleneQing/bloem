"use server";

import { cookies } from "next/headers";
import {
  INVITE_COOKIE_MAX_AGE_SECONDS,
  INVITE_COOKIE_NAME,
} from "@/lib/invite/cookie";
import { resolveInviteRedirect } from "@/lib/invite/redirect";
import { verifyInviteCodeForCookie } from "@/lib/invite/verify";
import type { InviteCodeInput } from "./validations";

export async function validateInvite(
  data: InviteCodeInput,
  next?: string | null,
) {
  const result = await verifyInviteCodeForCookie(data.code);
  if ("error" in result) {
    return { error: result.error } as const;
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: INVITE_COOKIE_NAME,
    value: result.cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: INVITE_COOKIE_MAX_AGE_SECONDS,
  });

  return { redirectTo: resolveInviteRedirect(next) } as const;
}

export async function clearInvite() {
  const cookieStore = await cookies();
  cookieStore.delete(INVITE_COOKIE_NAME);
  return { success: true } as const;
}
