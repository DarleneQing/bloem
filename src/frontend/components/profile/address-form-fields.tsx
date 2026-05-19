"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { AddressFormFields } from "@/features/auth/address-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressFormFieldsProps {
  register: UseFormRegister<AddressFormFields>;
  errors: FieldErrors<AddressFormFields>;
  inputClassName?: string;
  legend?: string;
}

export function AddressFieldsGroup({
  register,
  errors,
  inputClassName = "h-11 rounded-xl border-input bg-card px-4 text-base",
  legend = "Address",
}: AddressFormFieldsProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>

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
  );
}

