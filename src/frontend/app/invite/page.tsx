"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { AuthButton, AuthErrorDisplay } from "@/components/auth/AuthForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateInvite } from "@/features/invite/actions";
import {
  inviteCodeSchema,
  type InviteCodeInput,
} from "@/features/invite/validations";

const BRAND_LOGO = "/assets/images/brand-transparent.png";

function isSafeRedirect(path: string | null): path is string {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export default function InvitePage() {
  return (
    <Suspense fallback={null}>
      <InvitePageInner />
    </Suspense>
  );
}

function InvitePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<InviteCodeInput>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: { code: "" },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onSubmit = async (data: InviteCodeInput) => {
    setLoading(true);
    setError(null);

    const result = await validateInvite(data);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next");
    const target = isSafeRedirect(next) ? next : "/auth/sign-up";
    router.push(target);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:py-10 lg:px-8 lg:py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Image
            src={BRAND_LOGO}
            alt="bloem"
            width={200}
            height={60}
            className="h-10 w-auto sm:h-11 lg:h-12"
            priority
          />
          <p className="mt-2 max-w-xs text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary sm:text-xs">
            Circular fashion, community driven.
          </p>

          <h1 className="mt-8 text-2xl font-semibold text-foreground sm:text-3xl">
            We&apos;re in pre-launch
          </h1>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            bloem is currently invite-only. Enter the code we shared with you to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 space-y-6 rounded-2xl border bg-card p-8 shadow-lg"
        >
          <AuthErrorDisplay error={error} />

          <div className="space-y-2">
            <Label htmlFor="code" className="block">
              Invite code
            </Label>
            <Input
              id="code"
              type="text"
              autoComplete="off"
              autoFocus
              placeholder="Enter your invite code"
              {...register("code")}
              className="h-11 rounded-xl border-input bg-background px-4 text-base lg:h-12"
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          <AuthButton loading={loading} className="rounded-xl lg:h-12">
            {loading ? "Checking..." : "Continue"}
          </AuthButton>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don&apos;t have a code? Reach out to the bloem team.
        </p>
      </div>
    </div>
  );
}
