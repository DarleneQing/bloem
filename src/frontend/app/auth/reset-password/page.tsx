"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { resetPassword } from "@/features/auth/actions";
import { resetPasswordSchema, type ResetPasswordInput } from "@/features/auth/validations";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await resetPassword(data.email);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset your password</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-primary/15 p-4 text-center">
            <p className="text-sm font-medium">Check your email</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ve sent a password reset link to your email address.
            </p>
            <Button asChild className="mt-4">
              <Link href="/auth/sign-in">Back to Sign In</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

