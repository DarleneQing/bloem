"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateIBAN } from "@/features/auth/actions";
import { sellerActivationSchema, type SellerActivationInput } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileWithStatus } from "@/types/database";

export function ProfileForm({ profile }: { profile: ProfileWithStatus }) {
  const [showIBANForm, setShowIBANForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SellerActivationInput>({
    resolver: zodResolver(sellerActivationSchema),
  });

  const onIBANSubmit = async (data: SellerActivationInput) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateIBAN(data);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setShowIBANForm(false);
      reset();
      // Refresh the page to show updated status
      window.location.reload();
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-bold text-primary mb-4">Seller Information</h2>

      {!profile.isActiveSeller ? (
        <div>
          {!showIBANForm ? (
            <div>
              <p className="text-base text-muted-foreground mb-4">
                To start selling items at pop-up markets, you need to activate your seller
                account by providing your bank details.
              </p>
              <ul className="list-disc list-inside text-base text-muted-foreground mb-6 space-y-2">
                <li>List items at pop-up markets</li>
                <li>Rent hangers at market locations</li>
                <li>Receive payments directly to your bank account</li>
                <li>Track your sales and earnings</li>
              </ul>
              <Button onClick={() => setShowIBANForm(true)} variant="accent" size="lg">Activate Seller Account</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onIBANSubmit)} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-destructive/15 p-4 text-base text-destructive border border-destructive/30">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-brand-accent/15 p-4 text-base text-foreground border border-brand-accent/30">
                  Seller account activated successfully!
                </div>
              )}

              <div>
                <Label htmlFor="iban" className="block mb-2">
                  IBAN
                </Label>
                <Input
                  id="iban"
                  type="text"
                  placeholder="DE89370400440532013000"
                  {...register("iban")}
                  className="h-11 rounded-lg px-4 text-base transition-all"
                />
                {errors.iban && (
                  <p className="mt-1 text-sm text-destructive">{errors.iban.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bankName" className="block mb-2">
                  Bank Name
                </Label>
                <Input
                  id="bankName"
                  type="text"
                  placeholder="e.g., Deutsche Bank"
                  {...register("bankName")}
                  className="h-11 rounded-lg px-4 text-base transition-all"
                />
                {errors.bankName && (
                  <p className="mt-1 text-sm text-destructive">{errors.bankName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="accountHolderName" className="block mb-2">
                  Account Holder Name
                </Label>
                <Input
                  id="accountHolderName"
                  type="text"
                  placeholder="Full name as on bank account"
                  {...register("accountHolderName")}
                  className="h-11 rounded-lg px-4 text-base transition-all"
                />
                {errors.accountHolderName && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.accountHolderName.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" size="lg" disabled={loading} className="flex-1 sm:flex-none">
                  {loading ? "Activating..." : "Activate Seller Account"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowIBANForm(false);
                    reset();
                    setError(null);
                  }}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-accent/20 border border-brand-accent/30 px-4 py-2 text-base font-semibold text-foreground mb-4">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Active Seller
          </div>
          <p className="text-base text-muted-foreground mb-6">
            Your seller account is active. You can now list items at markets and receive payouts.
          </p>
          {profile.iban && (
            <div className="space-y-3 text-base">
              <div>
                <span className="text-muted-foreground font-medium">IBAN:</span>{" "}
                <span className="font-mono font-semibold">••••{profile.iban.slice(-4)}</span>
              </div>
              {profile.bank_name && (
                <div>
                  <span className="text-muted-foreground font-medium">Bank:</span>{" "}
                  <span className="font-semibold">{profile.bank_name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

