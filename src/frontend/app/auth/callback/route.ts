import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only allow same-origin, path-relative redirects — reject protocol-relative
// (`//evil.com`) and backslash (`/\evil.com`, browsers treat `\` as `/`)
// targets that could send a signed-in user off-site. Same rule as
// `lib/invite/redirect.ts`, plus the backslash guard.
function resolveCallbackNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
    return next;
  }
  return "/profile";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = resolveCallbackNext(requestUrl.searchParams.get("next"));
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Redirect to error page or sign-in with error message
      return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${next}`);
}
