"use client";

import PhoneInput from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import type { Country } from "react-phone-number-input";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import "react-phone-number-input/style.css";

const PHONE_INPUT_CLASS =
  "h-11 rounded-xl border border-input bg-card px-3 text-base lg:h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const PHONE_INPUT_WRAPPER_CLASS =
  "[&_.PhoneInput]:flex [&_.PhoneInput]:items-center [&_.PhoneInput]:gap-3 " +
  "[&_.PhoneInputCountry]:mr-0 [&_.PhoneInputCountry]:shrink-0 [&_.PhoneInputCountry]:self-center " +
  "[&_.PhoneInputCountryIcon]:!h-[1.125rem] [&_.PhoneInputCountryIcon]:!w-[1.6875rem] " +
  "[&_.PhoneInputCountryIconImg]:block [&_.PhoneInputCountryIconImg]:!h-full [&_.PhoneInputCountryIconImg]:!w-full [&_.PhoneInputCountryIconImg]:object-cover";

interface PhoneFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  error?: string;
  id?: string;
  defaultCountry?: Country;
}

export function PhoneField<T extends FieldValues>({
  control,
  name,
  label = "Phone (Optional)",
  error,
  id = "phone",
  defaultCountry = "CH",
}: PhoneFieldProps<T>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <div className={PHONE_INPUT_WRAPPER_CLASS}>
            <PhoneInput
              id={id}
              international
              defaultCountry={defaultCountry}
              labels={en}
              value={typeof value === "string" && value.length > 0 ? value : undefined}
              onChange={(next) => onChange(next ?? "")}
              numberInputProps={{
                className: cn(PHONE_INPUT_CLASS, "min-w-0 flex-1 w-full"),
                autoComplete: "tel-national",
              }}
              className="flex w-full gap-3"
            />
          </div>
        )}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

