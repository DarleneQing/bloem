"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { ProfileInfoRow } from "@/components/profile/profile-info-row";
import { AddressFieldsGroup } from "@/components/profile/address-form-fields";
import { PhoneField } from "@/components/auth/phone-field";
import { updateProfile } from "@/features/auth/actions";
import {
  addressFormFieldsSchema,
  formatEuropeanAddress,
  parseEuropeanAddress,
  type AddressFormFields,
} from "@/features/auth/address-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const phoneFieldSchema = z.object({
  phone: z
    .string()
    .max(50, "Phone number is too long")
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || isValidPhoneNumber(value), {
      message: "Invalid phone number",
    }),
});

type PhoneFieldForm = z.infer<typeof phoneFieldSchema>;

interface ProfileEditableFieldProps {
  label: string;
  value: string | null;
  field: "phone" | "address";
  placeholder: string;
}

export function ProfileEditableField({
  label,
  value,
  field,
  placeholder,
}: ProfileEditableFieldProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAddress = field === "address";

  const phoneForm = useForm<PhoneFieldForm>({
    resolver: zodResolver(phoneFieldSchema),
    defaultValues: { phone: value ?? "" },
  });

  const addressForm = useForm<AddressFormFields>({
    resolver: zodResolver(addressFormFieldsSchema),
    defaultValues: parseEuropeanAddress(value),
  });

  const openDialog = () => {
    if (isAddress) {
      addressForm.reset(parseEuropeanAddress(value));
    } else {
      phoneForm.reset({ phone: value ?? "" });
    }
    setError(null);
    setOpen(true);
  };

  const onSubmitPhone = async (data: PhoneFieldForm) => {
    setLoading(true);
    setError(null);

    const result = await updateProfile({
      phone: data.phone?.trim() ? data.phone.trim() : undefined,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    window.location.reload();
  };

  const onSubmitAddress = async (data: AddressFormFields) => {
    setLoading(true);
    setError(null);

    const result = await updateProfile({
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

  const phoneErrors = phoneForm.formState.errors;
  const addressErrors = addressForm.formState.errors;

  return (
    <>
      <ProfileInfoRow
        label={label}
        value={value || "—"}
        onEdit={openDialog}
        editLabel={`Edit ${label.toLowerCase()}`}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={
            isAddress
              ? "max-h-[90vh] max-w-md overflow-y-auto rounded-2xl"
              : "max-w-sm rounded-2xl"
          }
        >
          <DialogHeader>
            <DialogTitle>Edit {label}</DialogTitle>
          </DialogHeader>

          {isAddress ? (
            <form
              onSubmit={addressForm.handleSubmit(onSubmitAddress)}
              className="space-y-4"
            >
              {error && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <AddressFieldsGroup
                register={addressForm.register}
                errors={addressErrors}
                inputClassName="mt-0 h-11"
                legend=""
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
          ) : (
            <form onSubmit={phoneForm.handleSubmit(onSubmitPhone)} className="space-y-4">
              {error && (
                <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <PhoneField
                control={phoneForm.control}
                name="phone"
                label={label}
                defaultCountry="CH"
                error={phoneErrors.phone?.message}
              />
              {!phoneErrors.phone && placeholder ? (
                <p className="text-xs text-muted-foreground">{placeholder}</p>
              ) : null}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
