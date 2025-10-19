import { z } from "zod";

// Sign up schema
export const signUpSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

// Sign in schema
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .optional(),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// IBAN validation schema (for seller activation)
export const ibanSchema = z.object({
  iban: z
    .string()
    .min(15, "IBAN must be at least 15 characters")
    .max(34, "IBAN must be less than 34 characters")
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, "Invalid IBAN format"),
  bankName: z
    .string()
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name must be less than 100 characters"),
  accountHolderName: z
    .string()
    .min(2, "Account holder name must be at least 2 characters")
    .max(100, "Account holder name must be less than 100 characters"),
});

export type IBANInput = z.infer<typeof ibanSchema>;

// Reset password schema
export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Update password schema
export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

