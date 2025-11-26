"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signUp, signInWithGoogle } from "@/features/auth/actions";
import { userRegistrationSchema, type UserRegistrationInput } from "@/lib/validations/schemas";
import { 
  AuthForm, 
  AuthInput, 
  PasswordInput, 
  AuthButton, 
  GoogleOAuthButton, 
  AuthErrorDisplay, 
  AuthDivider 
} from "@/components/auth/AuthForm";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserRegistrationInput>({
    resolver: zodResolver(userRegistrationSchema),
  });

  const {
    register,
    formState: { errors },
  } = form;

  const onSubmit = async (data: UserRegistrationInput) => {
    setLoading(true);
    setError(null);

    const result = await signUp(data);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If successful, user will be redirected automatically
    // Either to /dashboard (no email confirmation) or /auth/confirm-email (confirmation required)
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-black text-primary">Create your account</h1>
          <p className="mt-2 text-lg text-muted-foreground">Join the Bloem marketplace</p>
        </div>

        <AuthForm onSubmit={onSubmit} form={form}>
          <AuthErrorDisplay error={error} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AuthInput
              id="firstName"
              name="firstName"
              type="text"
              label="First Name"
              required
              register={register}
              error={errors.firstName?.message}
            />
            <AuthInput
              id="lastName"
              name="lastName"
              type="text"
              label="Last Name"
              required
              register={register}
              error={errors.lastName?.message}
            />
          </div>

          <AuthInput
            id="email"
            name="email"
            type="email"
            label="Email"
            required
            register={register}
            error={errors.email?.message}
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            required
            register={register}
            error={errors.password?.message}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            helperText="Must be at least 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character"
          />

          <AuthInput
            id="phone"
            name="phone"
            type="tel"
            label="Phone (Optional)"
            register={register}
            error={errors.phone?.message}
          />

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">
              Address (Optional)
            </label>
            <textarea
              id="address"
              {...register("address")}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-y"
            />
          </div>

          <AuthButton loading={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </AuthButton>
        </AuthForm>

        <AuthDivider />

        <GoogleOAuthButton onClick={handleGoogleSignIn} disabled={loading}>
          Sign up with Google
        </GoogleOAuthButton>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

