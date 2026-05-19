import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";
import { getAppUrl, getStripe } from "@/lib/stripe/server";
import { createStripeConnectedAccount } from "@/lib/stripe/connect-account";

/**
 * POST /api/admin/users/[id]/stripe-reverify
 * Create a Stripe Connect Account Link so the seller can complete or refresh verification.
 * @see https://docs.stripe.com/connect/express-dashboard#account-links
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminServer();
    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, email, first_name, last_name, stripe_account_id, stripe_details_submitted"
      )
      .eq("id", params.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const stripe = getStripe();
    const appUrl = getAppUrl();
    let accountId = profile.stripe_account_id;

    if (!accountId) {
      const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
      const account = await createStripeConnectedAccount({
        userId: profile.id,
        email: profile.email,
        displayName: displayName || undefined,
      });
      accountId = account.id;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", profile.id);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: "Failed to link Stripe account" },
          { status: 500 }
        );
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/profile?onboarding=refresh`,
      return_url: `${appUrl}/profile?onboarding=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      success: true,
      data: {
        url: accountLink.url,
        linkType: "account_onboarding",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create verification link";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
