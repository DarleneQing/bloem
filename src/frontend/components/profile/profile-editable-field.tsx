"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProfileInfoRow } from "@/components/profile/profile-info-row";
import { updateProfile } from "@/features/auth/actions";
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

const fieldSchema = z.object({
  value: z.string().max(500, "Value is too long"),
});

type FieldSchema = z.infer<typeof fieldSchema>;

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldSchema>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { value: value ?? "" },
  });

  const openDialog = () => {
    reset({ value: value ?? "" });
    setError(null);
    setOpen(true);
  };

  const onSubmit = async (data: FieldSchema) => {
    setLoading(true);
    setError(null);

    const result = await updateProfile(
      field === "phone" ? { phone: data.value || undefined } : { address: data.value || undefined }
    );

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
      <ProfileInfoRow
        label={label}
        value={value || "—"}
        onEdit={openDialog}
        editLabel={`Edit ${label.toLowerCase()}`}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit {label}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive rounded-lg bg-destructive/10 p-3">{error}</p>
            )}
            <div>
              <Label htmlFor={`edit-${field}`}>{label}</Label>
              <Input
                id={`edit-${field}`}
                placeholder={placeholder}
                {...register("value")}
                className="mt-2 h-11"
              />
              {errors.value && (
                <p className="mt-1 text-sm text-destructive">{errors.value.message}</p>
              )}
            </div>
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
