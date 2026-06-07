import { cookies } from "next/headers";
import {
  type InvitePayload,
  signInvitePayload,
  verifyInviteCookieValue,
  INVITE_COOKIE_MAX_AGE_SECONDS,
  INVITE_COOKIE_NAME,
} from "@/lib/invite/cookie-crypto";

export type { InvitePayload };
export {
  signInvitePayload,
  verifyInviteCookieValue,
  INVITE_COOKIE_MAX_AGE_SECONDS,
  INVITE_COOKIE_NAME,
};

export async function hasValidInviteCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(INVITE_COOKIE_NAME)?.value;
  return (await verifyInviteCookieValue(value)) !== null;
}

export async function readInviteCookie(): Promise<InvitePayload | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(INVITE_COOKIE_NAME)?.value;
  return verifyInviteCookieValue(value);
}
