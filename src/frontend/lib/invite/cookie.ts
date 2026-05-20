import { cookies } from "next/headers";

const COOKIE_NAME = "bloem_invite";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface InvitePayload {
  code: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.INVITE_COOKIE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("INVITE_COOKIE_SECRET is not configured (min 16 chars)");
  }
  return secret;
}

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function signInvitePayload(code: string): Promise<string> {
  const payload: InvitePayload = {
    code,
    exp: Date.now() + COOKIE_MAX_AGE_SECONDS * 1000,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = await hmacHex(getSecret(), encoded);
  return `${encoded}.${sig}`;
}

export async function verifyInviteCookieValue(
  value: string | undefined,
): Promise<InvitePayload | null> {
  if (!value) return null;
  const [encoded, sig] = value.split(".");
  if (!encoded || !sig) return null;
  let expectedSig: string;
  try {
    expectedSig = await hmacHex(getSecret(), encoded);
  } catch {
    return null;
  }
  if (!timingSafeEqual(sig, expectedSig)) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecode(encoded));
  } catch {
    return null;
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("code" in payload) ||
    !("exp" in payload)
  ) {
    return null;
  }
  const { code, exp } = payload as { code: unknown; exp: unknown };
  if (typeof code !== "string" || code.length === 0) return null;
  if (typeof exp !== "number" || exp < Date.now()) return null;
  return { code, exp };
}

export async function hasValidInviteCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return (await verifyInviteCookieValue(value)) !== null;
}

export async function readInviteCookie(): Promise<InvitePayload | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return verifyInviteCookieValue(value);
}

export const INVITE_COOKIE_NAME = COOKIE_NAME;
export const INVITE_COOKIE_MAX_AGE_SECONDS = COOKIE_MAX_AGE_SECONDS;
