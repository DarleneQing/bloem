"use server";

import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import {
  INVITE_COOKIE_MAX_AGE_SECONDS,
  INVITE_COOKIE_NAME,
  signInvitePayload,
} from "@/lib/invite/cookie";
import { inviteCodeSchema, type InviteCodeInput } from "./validations";

export async function validateInvite(data: InviteCodeInput) {
  const parsed = inviteCodeSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invite code is required" } as const;
  }
  const code = parsed.data.code;

  const supabase = createServiceClient();
  const { data: invite, error } = await supabase
    .from("invite_codes")
    .select("code, revoked_at")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return { error: "Could not verify invite code. Please try again." } as const;
  }
  if (!invite || invite.revoked_at !== null) {
    return { error: "That invite code isn't valid." } as const;
  }

  const cookieValue = await signInvitePayload(invite.code);
  const cookieStore = await cookies();
  cookieStore.set({
    name: INVITE_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: INVITE_COOKIE_MAX_AGE_SECONDS,
  });

  return { success: true } as const;
}

export async function clearInvite() {
  const cookieStore = await cookies();
  cookieStore.delete(INVITE_COOKIE_NAME);
  return { success: true } as const;
}
