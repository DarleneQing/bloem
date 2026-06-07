import { NextRequest, NextResponse } from "next/server";
import {
  INVITE_COOKIE_MAX_AGE_SECONDS,
  INVITE_COOKIE_NAME,
} from "@/lib/invite/cookie";
import { resolveInviteRedirect } from "@/lib/invite/redirect";
import { verifyInviteCodeForCookie } from "@/lib/invite/verify";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const code =
    typeof body === "object" && body !== null && "code" in body
      ? (body as { code: unknown }).code
      : undefined;
  const next =
    typeof body === "object" && body !== null && "next" in body
      ? (body as { next: unknown }).next
      : undefined;

  if (typeof code !== "string") {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  const result = await verifyInviteCodeForCookie(code);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const redirectTo = resolveInviteRedirect(
    typeof next === "string" ? next : null,
  );
  const response = NextResponse.redirect(new URL(redirectTo, request.url), 303);
  response.cookies.set({
    name: INVITE_COOKIE_NAME,
    value: result.cookieValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: INVITE_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
