"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signInWithEmail, signInWithGoogle } from "@/features/auth/actions";
import { userSignInSchema, type UserSignInInput } from "@/lib/validations/schemas";
import { 
  AuthForm, 
  AuthInput, 
  AuthButton, 
  GoogleOAuthButton, 
  AuthErrorDisplay, 
  AuthDivider 
} from "@/components/auth/AuthForm";

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserSignInInput>({
    resolver: zodResolver(userSignInSchema),
  });

  const {
    register,
    formState: { errors },
  } = form;

  const onSubmit = async (data: UserSignInInput) => {
    setLoading(true);
    setError(null);

    const result = await signInWithEmail(data);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // If successful, user will be redirected
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-black text-primary">Welcome back</h1>
          <p className="mt-2 text-lg text-muted-foreground">Sign in to your Bloem account</p>
        </div>

        <AuthForm onSubmit={onSubmit} form={form}>
          <AuthErrorDisplay error={error} />

          <AuthInput
            id="email"
            type="email"
            label="Email"
            register={register}
            error={errors.email?.message}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <Link
                href="/auth/reset-password"
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full h-11 rounded-lg border border-input bg-background px-4 py-2 pr-12 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <AuthButton loading={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </AuthButton>
        </AuthForm>

        <AuthDivider />

        <GoogleOAuthButton onClick={handleGoogleSignIn} disabled={loading}>
          Sign in with Google
        </GoogleOAuthButton>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

