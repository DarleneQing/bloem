import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  INVITE_COOKIE_NAME,
  verifyInviteCookieValue,
} from "@/lib/invite/cookie-crypto";

const INVITE_GATED_PREFIXES = ["/auth/sign-in", "/auth/sign-up"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user: _user },
  } = await supabase.auth.getUser();

  // Pre-launch invite gate: block direct access to /auth/sign-in and
  // /auth/sign-up unless the visitor has a valid signed invite cookie.
  // Remove this block at launch.
  const pathname = request.nextUrl.pathname;
  const needsInvite = INVITE_GATED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (needsInvite) {
    const inviteCookie = request.cookies.get(INVITE_COOKIE_NAME)?.value;
    const payload = await verifyInviteCookieValue(inviteCookie);
    if (!payload) {
      const url = request.nextUrl.clone();
      url.pathname = "/invite";
      url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  }

  // Protected routes logic can be added here
  // if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/auth/sign-in'
  //   return NextResponse.redirect(url)
  // }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse;
}

