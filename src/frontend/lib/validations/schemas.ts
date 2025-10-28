import { z } from "zod";

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(255, "Email must be less than 255 characters");

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .regex(/^[a-zA-Z\s\-'\.]+$/, "Name can only contain letters, spaces, hyphens, apostrophes, and periods");

/**
 * Phone number validation schema
 */
export const phoneSchema = z
  .string()
  .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format")
  .optional()
  .or(z.literal(""));

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .optional()
  .or(z.literal(""));

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .uuid("Invalid UUID format");

/**
 * IBAN validation schema
 */
export const ibanSchema = z
  .string()
  .min(15, "IBAN must be at least 15 characters")
  .max(34, "IBAN must be less than 34 characters")
  .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/, "Invalid IBAN format")
  .refine((val) => !val.includes(" "), "IBAN cannot contain spaces");

// ============================================================================
// USER VALIDATION SCHEMAS
// ============================================================================

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;

/**
 * User sign-in schema
 */
export const userSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type UserSignInInput = z.infer<typeof userSignInSchema>;

/**
 * User profile update schema
 */
export const userProfileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema,
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
  avatarUrl: urlSchema,
});

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;

/**
 * Seller activation schema
 */
export const sellerActivationSchema = z.object({
  iban: ibanSchema,
  bankName: z
    .string()
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name must be less than 100 characters"),
  accountHolderName: z
    .string()
    .min(2, "Account holder name must be at least 2 characters")
    .max(100, "Account holder name must be less than 100 characters"),
});

export type SellerActivationInput = z.infer<typeof sellerActivationSchema>;

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  email: emailSchema,
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/**
 * Password update schema
 */
export const passwordUpdateSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;

/**
 * Wardrobe privacy toggle schema
 */
export const wardrobePrivacyToggleSchema = z.object({
  public: z.boolean(),
});

export type WardrobePrivacyToggleInput = z.infer<typeof wardrobePrivacyToggleSchema>;

// ============================================================================
// ITEM VALIDATION SCHEMAS
// ============================================================================

/**
 * Item category enum
 */
export const itemCategorySchema = z.enum([
  "TOPS",
  "BOTTOMS",
  "DRESSES",
  "OUTERWEAR",
  "SHOES",
  "ACCESSORIES",
  "BAGS",
  "JEWELRY",
  "OTHER",
]);

/**
 * Item condition enum
 */
export const itemConditionSchema = z.enum([
  "NEW_WITH_TAGS",
  "LIKE_NEW",
  "EXCELLENT",
  "GOOD",
  "FAIR",
]);

/**
 * Item size enum
 */
export const itemSizeSchema = z.enum([
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "ONE_SIZE",
]);

/**
 * Item status enum
 */
export const itemStatusSchema = z.enum([
  "WARDROBE",
  "RACK",
  "SOLD",
]);

/**
 * Item creation schema
 */
export const itemCreationSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  brand: z
    .string()
    .max(50, "Brand must be less than 50 characters")
    .optional(),
  category: itemCategorySchema,
  size: itemSizeSchema.optional(),
  condition: itemConditionSchema,
  color: z
    .string()
    .max(30, "Color must be less than 30 characters")
    .optional(),
  sellingPrice: z
    .number()
    .min(0.01, "Price must be at least €0.01")
    .max(10000, "Price must be less than €10,000")
    .optional(),
  imageUrls: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required")
    .max(5, "Maximum 5 images allowed"),
  // For sellers who want to immediately set it to RACK
  readyToSell: z.boolean().optional(),
});

export type ItemCreationInput = z.infer<typeof itemCreationSchema>;

/**
 * Item update schema
 */
export const itemUpdateSchema = itemCreationSchema.partial().extend({
  id: uuidSchema,
});

export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;

/**
 * Item status update schema
 */
export const itemStatusUpdateSchema = z.object({
  id: uuidSchema,
  status: itemStatusSchema,
});

export type ItemStatusUpdateInput = z.infer<typeof itemStatusUpdateSchema>;

/**
 * Move item to rack schema (for sellers)
 */
export const moveToRackSchema = z.object({
  itemId: uuidSchema,
  sellingPrice: z
    .number()
    .min(1, "Price must be at least €1")
    .max(1000, "Price must be less than €1000"),
});

export type MoveToRackInput = z.infer<typeof moveToRackSchema>;

/**
 * Privacy toggle schema
 */
export const privacyToggleSchema = z.object({
  itemId: uuidSchema,
});

export type PrivacyToggleInput = z.infer<typeof privacyToggleSchema>;

/**
 * Item search schema
 */
export const itemSearchSchema = z.object({
  query: z.string().min(1, "Search query is required").max(100, "Search query too long"),
  category: itemCategorySchema.optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  condition: itemConditionSchema.optional(),
  size: itemSizeSchema.optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
});

export type ItemSearchInput = z.infer<typeof itemSearchSchema>;

// ============================================================================
// MARKET VALIDATION SCHEMAS
// ============================================================================

/**
 * Market status enum
 */
export const marketStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

/**
 * Market creation schema
 */
export const marketCreationSchema = z.object({
  name: z
    .string()
    .min(1, "Market name is required")
    .min(3, "Market name must be at least 3 characters")
    .max(100, "Market name must be less than 100 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: "Description must be at least 10 characters if provided"
    }),
  locationName: z
    .string()
    .max(100, "Location name must be less than 100 characters")
    .optional(),
  streetName: z
    .string()
    .min(1, "Street name is required")
    .max(100, "Street name must be less than 100 characters"),
  streetNumber: z
    .string()
    .max(20, "Street number must be less than 20 characters")
    .optional(),
  zipCode: z
    .string()
    .max(20, "Zip code must be less than 20 characters")
    .optional(),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country must be less than 100 characters"),
  location: z
    .string()
    .optional(), // For backwards compatibility with API
  startDate: z.string().refine((val) => {
    // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and ISO format
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Invalid start date format"),
  endDate: z.string().refine((val) => {
    // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and ISO format
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Invalid end date format"),
  maxSellers: z
    .number()
    .min(1, "Maximum sellers must be at least 1")
    .max(1000, "Maximum sellers must be less than 1000")
    .optional(),
  maxHangers: z
    .number()
    .min(0, "Maximum hangers cannot be negative")
    .max(10000, "Maximum hangers must be less than 10,000")
    .optional(),
  hangerPrice: z
    .number()
    .min(0, "Hanger price cannot be negative")
    .max(100, "Hanger price must be less than €100")
    .optional(),
  picture: z
    .string()
    .optional()
    .refine((val) => {
      // Allow empty string or valid URL
      if (!val || val === "") return true;
      try {
        new URL(val);
        return val.length <= 500;
      } catch {
        return false;
      }
    }, "Picture must be a valid URL (max 500 characters)"),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type MarketCreationInput = z.infer<typeof marketCreationSchema>;

/**
 * Market update schema
 */
export const marketUpdateSchema = marketCreationSchema.partial().extend({
  id: uuidSchema,
});

export type MarketUpdateInput = z.infer<typeof marketUpdateSchema>;

/**
 * Market attendance schema
 */
export const marketAttendanceSchema = z.object({
  marketId: uuidSchema,
  hangerCount: z
    .number()
    .min(1, "Hanger count must be at least 1")
    .max(50, "Hanger count must be less than 50"),
});

export type MarketAttendanceInput = z.infer<typeof marketAttendanceSchema>;

// ============================================================================
// QR CODE VALIDATION SCHEMAS
// ============================================================================

/**
 * QR code batch creation schema
 */
export const qrCodeBatchCreationSchema = z.object({
  marketId: uuidSchema,
  itemCount: z
    .number()
    .min(1, "Item count must be at least 1")
    .max(1000, "Item count must be less than 1000"),
  batchName: z
    .string()
    .min(1, "Batch name is required")
    .max(100, "Batch name must be less than 100 characters")
    .optional(),
});

export type QRCodeBatchCreationInput = z.infer<typeof qrCodeBatchCreationSchema>;

/**
 * QR code linking schema
 */
export const qrCodeLinkingSchema = z.object({
  qrCodeId: uuidSchema,
  itemId: uuidSchema,
});

export type QRCodeLinkingInput = z.infer<typeof qrCodeLinkingSchema>;

/**
 * QR code scanning schema
 */
export const qrCodeScanningSchema = z.object({
  code: z
    .string()
    .min(1, "QR code is required")
    .max(100, "QR code too long"),
});

export type QRCodeScanningInput = z.infer<typeof qrCodeScanningSchema>;

// ============================================================================
// TRANSACTION VALIDATION SCHEMAS
// ============================================================================

/**
 * Transaction status enum
 */
export const transactionStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
]);

/**
 * Transaction creation schema
 */
export const transactionCreationSchema = z.object({
  itemId: uuidSchema,
  amount: z
    .number()
    .min(0.01, "Amount must be at least €0.01")
    .max(10000, "Amount must be less than €10,000"),
  currency: z.string().length(3, "Currency must be 3 characters").default("EUR"),
});

export type TransactionCreationInput = z.infer<typeof transactionCreationSchema>;

/**
 * Transaction update schema
 */
export const transactionUpdateSchema = z.object({
  id: uuidSchema,
  status: transactionStatusSchema,
});

export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;

/**
 * Refund request schema
 */
export const refundRequestSchema = z.object({
  transactionId: uuidSchema,
  amount: z
    .number()
    .min(0.01, "Refund amount must be at least €0.01")
    .max(10000, "Refund amount must be less than €10,000")
    .optional(),
  reason: z
    .string()
    .min(1, "Refund reason is required")
    .max(500, "Refund reason must be less than 500 characters"),
});

export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

// ============================================================================
// PAYOUT VALIDATION SCHEMAS
// ============================================================================

/**
 * Payout status enum
 */
export const payoutStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

/**
 * Payout request schema
 */
export const payoutRequestSchema = z.object({
  amount: z
    .number()
    .min(1, "Payout amount must be at least €1")
    .max(10000, "Payout amount must be less than €10,000"),
  iban: ibanSchema,
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
});

export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;

// ============================================================================
// NOTIFICATION VALIDATION SCHEMAS
// ============================================================================

/**
 * Notification type enum
 */
export const notificationTypeSchema = z.enum([
  "ITEM_SOLD",
  "PAYMENT_RECEIVED",
  "MARKET_REMINDER",
  "QR_CODE_LINKED",
  "PAYOUT_PROCESSED",
  "GENERAL",
  "SYSTEM",
]);

/**
 * Notification creation schema
 */
export const notificationCreationSchema = z.object({
  userId: uuidSchema,
  type: notificationTypeSchema,
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(500, "Message must be less than 500 characters"),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type NotificationCreationInput = z.infer<typeof notificationCreationSchema>;

/**
 * Notification preferences schema
 */
export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  pushEnabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
  itemSoldNotifications: z.boolean().default(true),
  paymentNotifications: z.boolean().default(true),
  marketReminders: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

// ============================================================================
// PAGINATION VALIDATION SCHEMAS
// ============================================================================

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().min(1, "Page must be at least 1").default(1),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit must be less than 100").default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Sort schema
 */
export const sortSchema = z.object({
  field: z.string().min(1, "Sort field is required"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export type SortInput = z.infer<typeof sortSchema>;

// ============================================================================
// FILE UPLOAD VALIDATION SCHEMAS
// ============================================================================

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, "File size must be less than 10MB")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "File must be a JPEG, PNG, or WebP image"
    ),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;

/**
 * Multiple file upload schema
 */
export const multipleFileUploadSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .min(1, "At least one file is required")
    .max(5, "Maximum 5 files allowed")
    .refine(
      (files) => files.every((file) => file.size <= 10 * 1024 * 1024),
      "All files must be less than 10MB"
    )
    .refine(
      (files) => files.every((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type)),
      "All files must be JPEG, PNG, or WebP images"
    ),
});

export type MultipleFileUploadInput = z.infer<typeof multipleFileUploadSchema>;

// ============================================================================
// IMAGE VALIDATION UTILITIES
// ============================================================================

/**
 * Validate single image file
 */
export function validateImageFile(file: File): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    throw new Error(`Image ${file.name} is too large. Maximum size is 5MB.`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Image ${file.name} has invalid type. Only JPEG, PNG, and WebP are allowed.`);
  }

  return true;
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(files: File[]): boolean {
  if (files.length < 1) {
    throw new Error("At least 1 image is required");
  }

  if (files.length > 5) {
    throw new Error("Maximum 5 images allowed");
  }

  files.forEach((file) => validateImageFile(file));

  return true;
}

// ============================================================================
// VALIDATION UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate data against schema
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => {
        const path = err.path.join(".");
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ["Validation failed"] };
  }
}

/**
 * Safe parse with error handling
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

/**
 * Get validation errors as object
 */
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  error.issues.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });
  
  return errors;
}
