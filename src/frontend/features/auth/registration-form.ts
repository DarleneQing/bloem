import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  userRegistrationSchema,
  type UserRegistrationInput,
} from "@/lib/validations/schemas";

const optionalText = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} must be less than ${max} characters`)
    .optional()
    .or(z.literal(""));

export const userRegistrationFormSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    phone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || isValidPhoneNumber(value), {
        message: "Invalid phone number",
      }),
    addressStreet: optionalText(120, "Street name"),
    addressHouseNumber: optionalText(20, "House number"),
    addressPostalCode: optionalText(20, "Postal code"),
    addressCity: optionalText(100, "City"),
    addressCountry: optionalText(100, "Country"),
  })
  .superRefine((data, ctx) => {
    const hasAddressField = [
      data.addressStreet,
      data.addressHouseNumber,
      data.addressPostalCode,
      data.addressCity,
      data.addressCountry,
    ].some((part) => part?.trim());

    if (!hasAddressField) {
      return;
    }

    if (!data.addressStreet?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Street name is required when providing an address",
        path: ["addressStreet"],
      });
    }
    if (!data.addressPostalCode?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Postal code is required when providing an address",
        path: ["addressPostalCode"],
      });
    }
    if (!data.addressCity?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "City is required when providing an address",
        path: ["addressCity"],
      });
    }
    if (!data.addressCountry?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Country is required when providing an address",
        path: ["addressCountry"],
      });
    }
  });

export type UserRegistrationFormInput = z.infer<typeof userRegistrationFormSchema>;

export function formatEuropeanAddress(
  parts: Pick<
    UserRegistrationFormInput,
    | "addressStreet"
    | "addressHouseNumber"
    | "addressPostalCode"
    | "addressCity"
    | "addressCountry"
  >
): string | undefined {
  const streetName = parts.addressStreet?.trim() ?? "";
  const houseNumber = parts.addressHouseNumber?.trim() ?? "";
  const postalCode = parts.addressPostalCode?.trim() ?? "";
  const city = parts.addressCity?.trim() ?? "";
  const country = parts.addressCountry?.trim() ?? "";

  if (!streetName && !houseNumber && !postalCode && !city && !country) {
    return undefined;
  }

  const streetPart = `${houseNumber ? `${houseNumber} ` : ""}${streetName}`.trim();
  const cityPart = `${postalCode ? `${postalCode} ` : ""}${city}`.trim();
  const segments = [streetPart, cityPart, country].filter(Boolean);

  return segments.length > 0 ? segments.join(", ") : undefined;
}

export function toUserRegistrationInput(
  data: UserRegistrationFormInput
): UserRegistrationInput {
  return userRegistrationSchema.parse({
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone?.trim() ? data.phone.trim() : "",
    address: formatEuropeanAddress(data) ?? "",
  });
}
