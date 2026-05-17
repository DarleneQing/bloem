"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { signInWithEmail, signInWithGoogle } from "@/features/auth/actions";
import { userSignInSchema, type UserSignInInput } from "@/lib/validations/schemas";
import {
  AuthButton,
  AuthErrorDisplay,
  GoogleOAuthButton,
  PasswordInput,
} from "@/components/auth/AuthForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SIGN_IN_ILLUSTRATION = "/assets/images/sign-in-fashion-illustration.png";
const BRAND_LOGO = "/assets/images/brand-transparent.png";

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserSignInInput>({
    resolver: zodResolver(userSignInSchema),
  });

  const {
    register,
    handleSubmit,
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
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:py-10 lg:px-8 lg:py-12">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:pr-4 xl:pr-8">
          <header className="flex flex-col items-center lg:items-start">
            <Image
              src={BRAND_LOGO}
              alt="bloem"
              width={200}
              height={60}
              className="h-10 w-auto sm:h-11 lg:h-12 xl:h-14"
              priority
            />
            <p className="mt-3 max-w-xs text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary sm:text-xs lg:mt-4 lg:max-w-sm lg:text-sm lg:tracking-[0.18em]">
              Circular fashion, community driven.
            </p>
          </header>

          <div className="relative mt-6 w-full max-w-[280px] sm:max-w-xs md:max-w-sm lg:mt-8 lg:max-w-md xl:max-w-lg">
            <Image
              src={SIGN_IN_ILLUSTRATION}
              alt="Woman holding a dress on a hanger"
              width={560}
              height={420}
              sizes="(max-width: 1024px) 320px, 480px"
              className="h-auto w-full object-contain"
              priority
            />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-col lg:mx-0 lg:max-w-none lg:justify-center lg:pl-2 xl:pl-6">
          <div className="mb-6 text-center lg:mb-8 lg:text-left">
            <h1 className="text-2xl font-black lowercase text-primary sm:text-3xl lg:text-4xl">
              Welcome back, bloemer
            </h1>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full space-y-5"
          >
            <AuthErrorDisplay error={error} />

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                  className="h-11 rounded-xl border-input bg-card px-4 pr-11 text-base lg:h-12"
                />
                <Mail
                  className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <PasswordInput
                id="password"
                name="password"
                label="Password"
                register={register}
                error={errors.password?.message}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
                className="rounded-xl border-input bg-card lg:h-12"
              />
              <Link
                href="/auth/reset-password"
                className="inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <AuthButton loading={loading} className="rounded-xl lg:h-12">
              {loading ? "Signing in..." : "Sign In"}
            </AuthButton>
          </form>

          <div className="mt-4 w-full">
            <GoogleOAuthButton
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="rounded-xl border-input bg-card font-medium text-foreground hover:bg-card/80 lg:h-12"
            >
              Continue with Google
            </GoogleOAuthButton>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground lg:text-left">
            New to bloem?{" "}
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
