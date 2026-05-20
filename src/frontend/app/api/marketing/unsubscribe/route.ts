import { NextRequest, NextResponse } from "next/server";
import { syncProfile as syncMarketingAudience } from "@/lib/email/audiences";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function htmlResponse(
  status: number,
  title: string,
  message: string,
  extraHeaders: Record<string, string> = {}
) {
  const safeTitle = title.replace(/[<>&]/g, "");
  const safeMessage = message.replace(/[<>&]/g, "");
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — bloem</title>
  <meta name="robots" content="noindex" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F7F4F2; color: #1a1a1a; margin: 0; padding: 40px 20px; }
    .card { max-width: 520px; margin: 60px auto; background: #fff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center; }
    h1 { color: #6B22B1; margin: 0 0 12px; font-size: 24px; }
    p { line-height: 1.6; color: #444; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
  </div>
</body>
</html>`;
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", ...extraHeaders },
  });
}

/**
 * GET /api/marketing/unsubscribe?token=<uuid>
 *
 * Public one-click unsubscribe. Called from the footer link of every Resend
 * broadcast. Returns server-rendered HTML — no client JS required, no
 * authentication needed (the token is the credential).
 */
export async function GET(request: NextRequest) {
  // Rate-limit by client IP. Anonymous endpoint — we don't trust the token
  // alone as the rate-limit key because a scraper could enumerate it.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rl = await checkRateLimit("newsletter_unsubscribe", ip);
  if (!rl.success) {
    return htmlResponse(
      429,
      "Too many requests",
      "Please wait a moment and try again.",
      rateLimitHeaders(rl)
    );
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token || !UUID_RE.test(token)) {
    return htmlResponse(
      404,
      "Invalid link",
      "This unsubscribe link is malformed. If you keep receiving emails, contact hello@letsbloem.com."
    );
  }

  const supabase = createServiceClient();

  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select(
      "id, email, first_name, last_name, role, stripe_account_id, stripe_payouts_enabled, marketing_consent, marketing_unsubscribe_token, suspended_at"
    )
    .eq("marketing_unsubscribe_token", token)
    .maybeSingle();

  if (lookupError || !profile) {
    return htmlResponse(
      404,
      "Link not found",
      "This unsubscribe link is no longer valid. If you keep receiving emails, contact hello@letsbloem.com."
    );
  }

  if (!profile.marketing_consent) {
    return htmlResponse(
      200,
      "You're already unsubscribed",
      "You will not receive any further marketing emails from bloem."
    );
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      marketing_consent: false,
      marketing_consent_updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    return htmlResponse(
      500,
      "Something went wrong",
      "We couldn't unsubscribe you right now. Please try the link again in a minute, or email hello@letsbloem.com."
    );
  }

  await syncMarketingAudience({
    ...profile,
    marketing_consent: false,
  });

  return htmlResponse(
    200,
    "You're unsubscribed",
    "You will no longer receive marketing emails from bloem. Transactional emails (order confirmations, payout notices) will still be sent."
  );
}
