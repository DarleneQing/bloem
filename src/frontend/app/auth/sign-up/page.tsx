"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { signUp, signInWithGoogle } from "@/features/auth/actions";
import {
  toUserRegistrationInput,
  userRegistrationFormSchema,
  type UserRegistrationFormInput,
} from "@/features/auth/registration-form";
import {
  AuthButton,
  AuthErrorDisplay,
  GoogleOAuthButton,
  PasswordInput,
} from "@/components/auth/AuthForm";
import { PhoneField } from "@/components/auth/phone-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BRAND_LOGO = "/assets/images/brand-transparent.png";

const defaultValues: UserRegistrationFormInput = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  addressStreet: "",
  addressHouseNumber: "",
  addressPostalCode: "",
  addressCity: "",
  addressCountry: "Switzerland",
  marketingConsent: false,
};

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserRegistrationFormInput>({
    resolver: zodResolver(userRegistrationFormSchema),
    defaultValues,
  });

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = form;

  const passwordValue = watch("password") ?? "";
  const passwordChecks = [
    { label: "At least 8 characters", ok: passwordValue.length >= 8 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(passwordValue) },
    { label: "One lowercase letter", ok: /[a-z]/.test(passwordValue) },
    { label: "One number", ok: /\d/.test(passwordValue) },
    { label: "One special character", ok: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  const onSubmit = async (data: UserRegistrationFormInput) => {
    setLoading(true);
    setError(null);

    const result = await signUp(toUserRegistrationInput(data));

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

  const inputClassName =
    "h-11 rounded-xl border-input bg-card px-4 text-base lg:h-12";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:py-10 lg:px-8 lg:py-12">
      <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:justify-center lg:pr-4 xl:pr-8">
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
        </div>

        <div className="mx-auto flex w-full max-w-md flex-col lg:mx-0 lg:max-w-none lg:justify-center lg:pl-2 xl:pl-6">
          <div className="mb-6 text-center lg:mb-8 lg:text-left">
            <h1 className="text-2xl font-black lowercase text-primary sm:text-3xl lg:text-4xl">
              Join the bloem community
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
            <AuthErrorDisplay error={error} />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  {...register("firstName")}
                  className={inputClassName}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  {...register("lastName")}
                  className={inputClassName}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                  className={`${inputClassName} pr-11`}
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
                required
                register={register}
                error={errors.password?.message}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
                className="rounded-xl border-input bg-card lg:h-12"
              />
              <ul className="grid grid-cols-1 gap-x-3 gap-y-1 text-xs sm:grid-cols-2">
                {passwordChecks.map((rule) => (
                  <li
                    key={rule.label}
                    className={
                      rule.ok
                        ? "flex items-center gap-1.5 font-medium text-brand-purple"
                        : "flex items-center gap-1.5 text-muted-foreground"
                    }
                  >
                    <span aria-hidden="true">{rule.ok ? "✓" : "○"}</span>
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <PhoneField
              control={control}
              name="phone"
              defaultCountry="CH"
              error={errors.phone?.message}
            />

            <fieldset className="space-y-4">
              <legend className="text-sm font-medium text-foreground">
                Address
              </legend>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_7rem]">
                <div className="space-y-2">
                  <Label htmlFor="addressStreet" className="text-sm font-medium text-foreground">
                    Street name
                  </Label>
                  <Input
                    id="addressStreet"
                    type="text"
                    autoComplete="address-line1"
                    placeholder="e.g. Bahnhofstrasse"
                    {...register("addressStreet")}
                    className={inputClassName}
                  />
                  {errors.addressStreet && (
                    <p className="text-sm text-destructive">{errors.addressStreet.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressHouseNumber" className="text-sm font-medium text-foreground">
                    No.
                  </Label>
                  <Input
                    id="addressHouseNumber"
                    type="text"
                    autoComplete="address-line2"
                    placeholder="101"
                    {...register("addressHouseNumber")}
                    className={inputClassName}
                  />
                  {errors.addressHouseNumber && (
                    <p className="text-sm text-destructive">{errors.addressHouseNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="addressPostalCode" className="text-sm font-medium text-foreground">
                    Postal code
                  </Label>
                  <Input
                    id="addressPostalCode"
                    type="text"
                    autoComplete="postal-code"
                    placeholder="8001"
                    {...register("addressPostalCode")}
                    className={inputClassName}
                  />
                  {errors.addressPostalCode && (
                    <p className="text-sm text-destructive">{errors.addressPostalCode.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressCity" className="text-sm font-medium text-foreground">
                    City
                  </Label>
                  <Input
                    id="addressCity"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Zürich"
                    {...register("addressCity")}
                    className={inputClassName}
                  />
                  {errors.addressCity && (
                    <p className="text-sm text-destructive">{errors.addressCity.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressCountry" className="text-sm font-medium text-foreground">
                  Country
                </Label>
                <Input
                  id="addressCountry"
                  type="text"
                  autoComplete="country-name"
                  placeholder="Switzerland"
                  {...register("addressCountry")}
                  className={inputClassName}
                />
                {errors.addressCountry && (
                  <p className="text-sm text-destructive">{errors.addressCountry.message}</p>
                )}
              </div>
            </fieldset>

            <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
              <input
                id="marketingConsent"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-input accent-primary"
                {...register("marketingConsent")}
              />
              <Label
                htmlFor="marketingConsent"
                className="text-sm font-normal leading-snug text-muted-foreground"
              >
                Send me bloem updates about new markets and seller
                opportunities. You can unsubscribe at any time.
              </Label>
            </div>

            <AuthButton loading={loading} className="rounded-xl lg:h-12">
              {loading ? "Creating account..." : "Sign Up"}
            </AuthButton>
          </form>

          <div className="mt-4 w-full">
            <GoogleOAuthButton
              onClick={handleGoogleSignIn}
              disabled={loading}
              unavailable
              className="rounded-xl border-input bg-card font-medium text-foreground hover:bg-card/80 lg:h-12"
            >
              Continue with Google
            </GoogleOAuthButton>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground lg:text-left">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
