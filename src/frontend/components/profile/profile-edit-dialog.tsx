"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { updateProfile } from "@/features/auth/actions";
import {
  addressFormFieldsSchema,
  formatEuropeanAddress,
  parseEuropeanAddress,
  type AddressFormFields,
} from "@/features/auth/address-form";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { nameSchema } from "@/lib/validations/schemas";
import { AddressFieldsGroup } from "@/components/profile/address-form-fields";
import { PhoneField } from "@/components/auth/phone-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileWithStatus } from "@/types/database";

const profileEditFormSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    phone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || isValidPhoneNumber(value), {
        message: "Invalid phone number",
      }),
  })
  .merge(addressFormFieldsSchema);

type ProfileEditFormInput = z.infer<typeof profileEditFormSchema>;

interface ProfileEditDialogProps {
  profile: ProfileWithStatus;
}

function toFormValues(profile: ProfileWithStatus): ProfileEditFormInput {
  return {
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone ?? "",
    ...parseEuropeanAddress(profile.address),
  };
}

export function ProfileEditDialog({ profile }: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileEditFormInput>({
    resolver: zodResolver(profileEditFormSchema),
    defaultValues: toFormValues(profile),
  });

  const openDialog = () => {
    reset(toFormValues(profile));
    setError(null);
    setOpen(true);
  };

  const onSubmit = async (data: ProfileEditFormInput) => {
    setLoading(true);
    setError(null);

    const result = await updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone?.trim() ? data.phone.trim() : undefined,
      address: formatEuropeanAddress(data) ?? undefined,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    window.location.reload();
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
        aria-label="Edit profile"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" className="mt-2 h-11" {...register("firstName")} />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" className="mt-2 h-11" {...register("lastName")} />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            <PhoneField
              control={control}
              name="phone"
              label="Phone"
              defaultCountry="CH"
              error={errors.phone?.message}
            />
            <AddressFieldsGroup
              register={register as unknown as UseFormRegister<AddressFormFields>}
              errors={errors as unknown as FieldErrors<AddressFormFields>}
              inputClassName="mt-0 h-11"
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
