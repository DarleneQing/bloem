"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { updateProfile } from "@/features/auth/actions";
import { userProfileUpdateSchema, type UserProfileUpdateInput } from "@/lib/validations/schemas";
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

interface ProfileEditDialogProps {
  profile: ProfileWithStatus;
}

export function ProfileEditDialog({ profile }: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserProfileUpdateInput>({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone ?? "",
      address: profile.address ?? "",
    },
  });

  const openDialog = () => {
    reset({
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone ?? "",
      address: profile.address ?? "",
    });
    setError(null);
    setOpen(true);
  };

  const onSubmit = async (data: UserProfileUpdateInput) => {
    setLoading(true);
    setError(null);

    const result = await updateProfile(data);

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
        className="flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm hover:text-primary hover:border-primary/30 transition-colors"
        aria-label="Edit profile"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive rounded-lg bg-destructive/10 p-3">{error}</p>
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
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" className="mt-2 h-11" {...register("phone")} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" className="mt-2 h-11" {...register("address")} />
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
