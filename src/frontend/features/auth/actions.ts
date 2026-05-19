"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

// `as const` is load-bearing across this file: call sites narrow on
// `result.error` vs `result.success` via discriminated-union inference,
// which only works when the literal types aren't widened to `string`.

// Sign up with email and password
export async function signUp(data: UserRegistrationInput) {
  const validated = userRegistrationSchema.parse(data);
  const supabase = await createClient();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
    options: {
      data: {
        first_name: validated.firstName,
        last_name: validated.lastName,
      },
    },
  });

  if (authError) {
    return { error: authError.message } as const;
  }

  if (!authData.user) {
    return { error: "Failed to create user" } as const;
  }

  // Update profile with additional information
  if (validated.phone || validated.address) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        phone: validated.phone || null,
        address: validated.address || null,
      })
      .eq("id", authData.user.id);

    if (profileError) {
      return { error: profileError.message } as const;
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
