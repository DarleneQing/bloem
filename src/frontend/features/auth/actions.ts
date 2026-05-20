"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { readInviteCookie } from "@/lib/invite/cookie";
import { getSignOutRedirectUrl } from "@/lib/auth/utils";
import {
  userRegistrationSchema,
  userSignInSchema,
  userProfileUpdateSchema,
  sellerActivationSchema,
  passwordResetSchema,
} from "@/lib/validations/schemas";
import type { UserRegistrationInput, UserSignInInput, UserProfileUpdateInput, SellerActivationInput } from "@/lib/validations/schemas";
import { createStripeConnectedAccount } from "@/lib/stripe/connect-account";
import { getAppUrl, getStripe } from "@/lib/stripe/server";
import { syncStripeAccountToProfile } from "@/lib/stripe/profile-sync";
import { syncProfile as syncMarketingAudience } from "@/lib/email/audiences";

// `as const` is load-bearing across this file: call sites narrow on
// `result.error` vs `result.success` via discriminated-union inference,
// which only works when the literal types aren't widened to `string`.

// Sign up with email and password.
//
// Pre-launch invite gate: we re-verify the signed cookie set by /invite
// against the invite_codes table here (defense in depth — middleware also
// blocks direct access to /auth/sign-up). With Supabase's global
// "Allow new signups" toggle expected to be OFF in production, we create
// the user via the service-role admin API; signInWithPassword then opens
// the session via the anon client so SSR cookies land normally.
// Remove the invite block at launch and revert to supabase.auth.signUp().
export async function signUp(data: UserRegistrationInput) {
  const validated = userRegistrationSchema.parse(data);

  const invitePayload = await readInviteCookie();
  if (!invitePayload) {
    return { error: "Invite required" } as const;
  }

  const adminSupabase = createServiceClient();

  const { data: invite, error: inviteError } = await adminSupabase
    .from("invite_codes")
    .select("code, revoked_at")
    .eq("code", invitePayload.code)
    .maybeSingle();

  if (inviteError || !invite || invite.revoked_at !== null) {
    return { error: "Invite code is no longer valid" } as const;
  }

  const { data: created, error: createError } =
    await adminSupabase.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
      user_metadata: {
        first_name: validated.firstName,
        last_name: validated.lastName,
      },
    });

  if (createError) {
    return { error: createError.message } as const;
  }
  if (!created.user) {
    return { error: "Failed to create user" } as const;
  }

  const supabase = await createClient();

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

  if (signInError) {
    return { error: signInError.message } as const;
  }

  // Synthesise the original auth-data shape so the rest of the function
  // (profile update + Resend sync) is unchanged.
  const authData = {
    user: signInData.user ?? created.user,
    session: signInData.session,
  };

  // Update profile with additional information.
  // `marketing_consent` is always written (FALSE by default) so the timestamp
  // reflects when the user saw the checkbox, not when the row was inserted.
  const profileUpdate: {
    phone?: string | null;
    address?: string | null;
    marketing_consent: boolean;
    marketing_consent_updated_at: string;
  } = {
    marketing_consent: validated.marketingConsent === true,
    marketing_consent_updated_at: new Date().toISOString(),
  };
  if (validated.phone || validated.address) {
    profileUpdate.phone = validated.phone || null;
    profileUpdate.address = validated.address || null;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", authData.user.id);

  if (profileError) {
    return { error: profileError.message } as const;
  }

  // Project into Resend (fire-and-forget — never blocks signup on Resend health).
  if (validated.marketingConsent === true) {
    const { data: freshProfile } = await supabase
      .from("profiles")
      .select(
        "email, first_name, last_name, role, stripe_account_id, stripe_payouts_enabled, marketing_consent, marketing_unsubscribe_token, suspended_at"
      )
      .eq("id", authData.user.id)
      .single();
    if (freshProfile) {
      await syncMarketingAudience(freshProfile);
    }
  }

  revalidatePath("/", "layout");

  // Check if email confirmation is required
  if (authData.session) {
    // User is logged in immediately (email confirmation disabled)
    redirect("/profile");
  }

  // Email confirmation required - redirect to confirmation page
  redirect("/auth/confirm-email");
}

// Sign in with email and password.
// On success this never returns (redirect throws); the only non-redirect
// return path is the error case.
export async function signInWithEmail(data: UserSignInInput) {
  const validated = userSignInSchema.parse(data);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password,
  });

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

// Sign in with Google OAuth
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message } as const;
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Failed to initiate OAuth flow" } as const;
}

// Sign out
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/", "layout");
  redirect(getSignOutRedirectUrl());
}

// Sign out form action (for Next.js forms)
export async function signOutAction(_formData: FormData): Promise<void> {
  const result = await signOut();
  if (result && "error" in result) {
    revalidatePath("/", "layout");
    redirect(getSignOutRedirectUrl());
  }
}

// Update profile
export async function updateProfile(data: UserProfileUpdateInput) {
  const validated = userProfileUpdateSchema.parse(data);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const updates: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
    address?: string | null;
    avatar_url?: string | null;
  } = {};

  if ("firstName" in data) {
    updates.first_name = validated.firstName;
  }
  if ("lastName" in data) {
    updates.last_name = validated.lastName;
  }
  if ("phone" in data) {
    updates.phone = validated.phone || null;
  }
  if ("address" in data) {
    updates.address = validated.address || null;
  }
  if ("avatarUrl" in data) {
    updates.avatar_url = validated.avatarUrl || null;
  }

  if (Object.keys(updates).length === 0) {
    return { error: "No fields to update" } as const;
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/profile");
  return { success: true } as const;
}

/** @deprecated Use Stripe Connect onboarding — kept for legacy callers */
export async function updateIBAN(data: SellerActivationInput) {
  const validated = sellerActivationSchema.parse(data);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      iban: validated.iban,
      bank_name: validated.bankName,
      account_holder_name: validated.accountHolderName,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/profile");
  return { success: true } as const;
}

export async function createStripeOnboardingLink() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, stripe_account_id, stripe_details_submitted")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" } as const;
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  let accountId = profile.stripe_account_id;

  if (!accountId) {
    const account = await createStripeConnectedAccount({
      userId: user.id,
      email: profile.email,
    });

    accountId = account.id;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);

    if (updateError) {
      return { error: updateError.message } as const;
    }
  }

  // Accounts v2 Express recipients only support account_onboarding (not account_update).
  // return_url sends the seller back to Bloem when they finish on Stripe.
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/profile?onboarding=refresh`,
    return_url: `${appUrl}/profile?onboarding=return`,
    type: "account_onboarding",
  });

  return { data: { url: accountLink.url } } as const;
}

export async function refreshStripeAccountStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.stripe_account_id) {
    return { error: "No Stripe account linked" } as const;
  }

  const account = await getStripe().accounts.retrieve(profile.stripe_account_id);
  await syncStripeAccountToProfile(account);

  revalidatePath("/profile");
  return { success: true } as const;
}

// Reset password (send email)
export async function resetPassword(email: string) {
  const validated = passwordResetSchema.parse({ email });
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/update-password`,
  });

  if (error) {
    return { error: error.message } as const;
  }

  return { success: true, message: "Password reset email sent" } as const;
}

// Update password (after reset)
export async function updatePassword(password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/", "layout");
  return { success: true } as const;
}
