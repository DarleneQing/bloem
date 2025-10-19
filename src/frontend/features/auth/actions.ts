"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  signUpSchema,
  signInSchema,
  updateProfileSchema,
  ibanSchema,
  resetPasswordSchema,
} from "./validations";
import type { SignUpInput, SignInInput, UpdateProfileInput, IBANInput } from "./validations";

// Sign up with email and password
export async function signUp(data: SignUpInput) {
  const validated = signUpSchema.parse(data);
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
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Failed to create user" };
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
      return { error: profileError.message };
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

// Sign in with email and password
export async function signInWithEmail(data: SignInInput): Promise<{ error: string } | never> {
  const validated = signInSchema.parse(data);
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password,
  });

  if (error) {
    return { error: error.message };
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
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Failed to initiate OAuth flow" };
}

// Sign out
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

// Sign out form action (for Next.js forms)
export async function signOutAction(formData: FormData): Promise<void> {
  await signOut();
}

// Update profile
export async function updateProfile(data: UpdateProfileInput) {
  const validated = updateProfileSchema.parse(data);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: validated.firstName,
      last_name: validated.lastName,
      phone: validated.phone || null,
      address: validated.address || null,
      avatar_url: validated.avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

// Update IBAN (activate seller)
export async function updateIBAN(data: IBANInput) {
  const validated = ibanSchema.parse(data);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      iban: validated.iban,
      bank_name: validated.bankName,
      account_holder_name: validated.accountHolderName,
      iban_verified_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

// Reset password (send email)
export async function resetPassword(email: string) {
  const validated = resetPasswordSchema.parse({ email });
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Password reset email sent" };
}

// Update password (after reset)
export async function updatePassword(password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

