import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  userRegistrationSchema,
  type UserRegistrationInput,
} from "@/lib/validations/schemas";
import {
  addressFormFieldsSchema,
  formatEuropeanAddress,
  type AddressFormFields,
} from "@/features/auth/address-form";

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
    // `defaultValues` in the sign-up form always supplies a boolean, so the
    // schema mirrors the form-input type (boolean, not boolean | undefined).
    // Keeping `.optional().default(false)` made z.infer's input/output types
    // diverge and react-hook-form's `zodResolver` could no longer be assigned
    // to `useForm<UserRegistrationFormInput>`. See the Vercel build that
    // failed at sign-up/page.tsx:47.
    marketingConsent: z.boolean(),
  })
  .merge(addressFormFieldsSchema);

export type UserRegistrationFormInput = z.infer<typeof userRegistrationFormSchema>;

export { formatEuropeanAddress };

export function toUserRegistrationInput(
  data: UserRegistrationFormInput
): UserRegistrationInput {
  return userRegistrationSchema.parse({
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone?.trim() ? data.phone.trim() : "",
    address: formatEuropeanAddress(data as AddressFormFields) ?? "",
    marketingConsent: data.marketingConsent ?? false,
  });
}
