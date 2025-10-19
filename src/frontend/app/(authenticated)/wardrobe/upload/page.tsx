"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/items/image-uploader";
import { itemUploadSchema, type ItemUploadInput, validateImageFiles } from "@/features/items/validations";
import { uploadItem } from "@/features/items/actions";
import { compressImages } from "@/lib/image/compression";
import { uploadMultipleItemImages } from "@/lib/storage/upload";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, ITEM_SIZES } from "@/types/items";
import { createClient } from "@/lib/supabase/client";

interface ImageFile {
  file: File;
  preview: string;
}

export default function UploadItemPage() {
  console.log("UploadItemPage component loaded");
  
  const router = useRouter();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [imageError, setImageError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [compressionProgress, setCompressionProgress] = useState<string>("");
  const [isActiveSeller, setIsActiveSeller] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ItemUploadInput>({
    resolver: zodResolver(itemUploadSchema) as unknown as Resolver<ItemUploadInput>,
    defaultValues: {
      isPublic: true, // Not used for individual items
      readyToSell: false,
    },
  });

  const readyToSell = watch("readyToSell");
  
  // Check if user is active seller
  useEffect(() => {
    async function checkSeller() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("iban_verified_at")
          .eq("id", user.id)
          .single();
        setIsActiveSeller(!!profile?.iban_verified_at);
      }
    }
    checkSeller();
  }, []);
  
  console.log("Component state:", { imageCount: images.length, isSubmitting, readyToSell, isActiveSeller });
  console.log("Form errors:", errors);

  const onSubmit = async (data: ItemUploadInput) => {
    console.log("Form submitted!", { data, imageCount: images.length });
    setSubmitError("");
    setImageError("");

    // Validate images
    try {
      validateImageFiles(images.map((img) => img.file));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Invalid images";
      console.error("Image validation error:", errorMsg);
      setImageError(errorMsg);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      console.log("Getting user...");
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
        setSubmitError(`Auth error: ${userError.message}`);
        setIsSubmitting(false);
        return;
      }

      if (!user) {
        console.error("No user found");
        setSubmitError("Not authenticated. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      console.log("User found:", user.id);

      // Step 1: Compress images
      console.log("Compressing images...");
      setCompressionProgress("Compressing images...");
      const compressedImages = await compressImages(images.map((img) => img.file));
      console.log("Images compressed:", compressedImages.length);

      // Step 2: Upload to Supabase Storage
      console.log("Uploading images to storage...");
      setCompressionProgress("Uploading images...");
      const uploadResults = await uploadMultipleItemImages(user.id, compressedImages);
      console.log("Images uploaded:", uploadResults);

      const imageUrls = uploadResults.map((result) => result.fullImageUrl);
      const thumbnailUrl = uploadResults[0].thumbnailUrl;

      // Step 3: Create item in database
      console.log("Saving item to database...");
      setCompressionProgress("Saving item...");
      const result = await uploadItem(data, imageUrls, thumbnailUrl);

      if (result.error) {
        console.error("Upload item error:", result.error);
        setSubmitError(result.error);
        setIsSubmitting(false);
        return;
      }

      console.log("Item saved successfully!");
      // Success - redirect to wardrobe
      setCompressionProgress("Success! Redirecting...");
      setTimeout(() => {
        router.push("/wardrobe");
        router.refresh();
      }, 500);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to upload item. Please try again.";
      setSubmitError(errorMsg);
      setIsSubmitting(false);
      setCompressionProgress("");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Item</h1>
        <p className="text-muted-foreground">
          Add a new item to your digital wardrobe.
          {isActiveSeller 
            ? " You can choose to make it ready to sell at markets immediately." 
            : " Activate your seller account to list items for sale at markets."}
        </p>
      </div>

      <form 
        onSubmit={handleSubmit(
          (data) => {
            console.log("✅ Form validation passed, calling onSubmit");
            onSubmit(data);
          },
          (errors) => {
            console.log("❌ Form validation failed:", errors);
          }
        )}
        className="space-y-8"
      >
        {/* Images Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Photos</h2>
          <ImageUploader
            images={images}
            onImagesChange={setImages}
            maxImages={5}
            error={imageError}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Upload 1-5 photos. First photo will be the cover image.
          </p>
        </div>

        {/* Item Details */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Item Details</h2>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title *
              </label>
              <input
                id="title"
                type="text"
                {...register("title")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="e.g., Vintage Levi's Denim Jacket"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe the item, its condition, fit, and any special features..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Two-column grid for smaller fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brand */}
              <div>
                <label htmlFor="brand" className="block text-sm font-medium mb-2">
                  Brand
                </label>
                <input
                  id="brand"
                  type="text"
                  {...register("brand")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g., Levi's"
                />
                {errors.brand && (
                  <p className="mt-1 text-sm text-destructive">{errors.brand.message}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium mb-2">
                  Color
                </label>
                <input
                  id="color"
                  type="text"
                  {...register("color")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g., Blue"
                />
                {errors.color && (
                  <p className="mt-1 text-sm text-destructive">{errors.color.message}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  {...register("category")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select category</option>
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              {/* Size */}
              <div>
                <label htmlFor="size" className="block text-sm font-medium mb-2">
                  Size
                </label>
                <select
                  id="size"
                  {...register("size")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select size</option>
                  {ITEM_SIZES.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
                {errors.size && (
                  <p className="mt-1 text-sm text-destructive">{errors.size.message}</p>
                )}
              </div>

              {/* Condition */}
              <div className="md:col-span-2">
                <label htmlFor="condition" className="block text-sm font-medium mb-2">
                  Condition *
                </label>
                <select
                  id="condition"
                  {...register("condition")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select condition</option>
                  {ITEM_CONDITIONS.map((cond) => (
                    <option key={cond.value} value={cond.value}>
                      {cond.label}
                    </option>
                  ))}
                </select>
                {errors.condition && (
                  <p className="mt-1 text-sm text-destructive">{errors.condition.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ready to Sell (sellers only) */}
        {isActiveSeller && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Selling Options</h2>
            <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
              <input type="checkbox" {...register("readyToSell")} className="mt-1" />
              <div className="flex-1">
                <p className="font-medium">Ready to Sell</p>
                <p className="text-sm text-muted-foreground">
                  Move this item directly to your rack for selling at markets
                </p>
              </div>
            </label>

            {readyToSell && (
              <div className="mt-4">
                <label htmlFor="sellingPrice" className="block text-sm font-medium mb-2">
                  Selling Price (€) *
                </label>
                <input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  {...register("sellingPrice", { valueAsNumber: true })}
                  className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="0.00"
                />
                {errors.sellingPrice && (
                  <p className="mt-1 text-sm text-destructive">{errors.sellingPrice.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {/* Compression Progress */}
        {compressionProgress && (
          <div className="rounded-md bg-primary/15 p-3 text-sm text-primary">
            {compressionProgress}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || images.length === 0}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {isSubmitting ? "Uploading..." : "Upload Item"}
          </button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
