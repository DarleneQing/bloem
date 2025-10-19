import { z } from "zod";

// Item upload schema
export const itemUploadSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be less than 500 characters"),
  brand: z.string().max(100, "Brand name must be less than 100 characters").optional(),
  category: z.enum([
    "TOPS",
    "BOTTOMS",
    "DRESSES",
    "OUTERWEAR",
    "SHOES",
    "ACCESSORIES",
    "BAGS",
    "JEWELRY",
    "OTHER",
  ]),
  size: z
    .enum(["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "ONE_SIZE"])
    .optional(),
  condition: z.enum(["NEW_WITH_TAGS", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR"]),
  color: z.string().max(50, "Color must be less than 50 characters").optional(),
  // Images handled separately as File objects
  isPublic: z.boolean().default(true),
  // For sellers who want to immediately set it to RACK
  readyToSell: z.boolean().optional(),
  sellingPrice: z
    .number()
    .min(1, "Price must be at least €1")
    .max(1000, "Price must be less than €1000")
    .optional(),
});

export type ItemUploadInput = z.infer<typeof itemUploadSchema>;

// Item update schema (similar to upload but all fields optional except title)
export const itemUpdateSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be less than 500 characters")
    .optional(),
  brand: z.string().max(100).optional(),
  category: z
    .enum([
      "TOPS",
      "BOTTOMS",
      "DRESSES",
      "OUTERWEAR",
      "SHOES",
      "ACCESSORIES",
      "BAGS",
      "JEWELRY",
      "OTHER",
    ])
    .optional(),
  size: z.enum(["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "ONE_SIZE"]).optional(),
  condition: z.enum(["NEW_WITH_TAGS", "LIKE_NEW", "EXCELLENT", "GOOD", "FAIR"]).optional(),
  color: z.string().max(50).optional(),
});

export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;

// Move to rack schema (for sellers)
export const moveToRackSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  sellingPrice: z
    .number()
    .min(1, "Price must be at least €1")
    .max(1000, "Price must be less than €1000"),
});

export type MoveToRackInput = z.infer<typeof moveToRackSchema>;

// Privacy toggle schema
export const privacyToggleSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
});

export type PrivacyToggleInput = z.infer<typeof privacyToggleSchema>;

// Image file validation
export const validateImageFile = (file: File): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (file.size > maxSize) {
    throw new Error(`Image ${file.name} is too large. Maximum size is 5MB.`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Image ${file.name} has invalid type. Only JPEG, PNG, and WebP are allowed.`);
  }

  return true;
};

export const validateImageFiles = (files: File[]): boolean => {
  if (files.length < 1) {
    throw new Error("At least 1 image is required");
  }

  if (files.length > 5) {
    throw new Error("Maximum 5 images allowed");
  }

  files.forEach((file) => validateImageFile(file));

  return true;
};

