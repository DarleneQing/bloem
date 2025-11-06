"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/items/image-uploader";
import { Combobox } from "@/components/ui/combobox";
import { itemCreationSchema, type ItemCreationInput, validateImageFiles } from "@/lib/validations/schemas";
import { uploadItem } from "@/features/items/actions";
import { compressImages } from "@/lib/image/compression";
import { uploadMultipleItemImages } from "@/lib/storage/upload";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, GENDERS } from "@/types/items";
import { createClient } from "@/lib/supabase/client";
import { getAllBrands, createBrand } from "@/lib/data/brands";
import { getAllColors } from "@/lib/data/colors";
import { getSizesByCategory } from "@/lib/data/sizes";
import { getSubcategoriesByCategory } from "@/lib/data/subcategories";
import type { Brand, Color, Size, Subcategory, ItemCategory } from "@/types/items";

interface ImageFile {
  file: File;
  preview: string;
}

export default function UploadItemPage() {
  
  const router = useRouter();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [imageError, setImageError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [compressionProgress, setCompressionProgress] = useState<string>("");
  const [isActiveSeller, setIsActiveSeller] = useState(false);

  // Dynamic data states
  const [brands, setBrands] = useState<Brand[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newBrandName, setNewBrandName] = useState("");
  const [showNewBrand, setShowNewBrand] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ItemCreationInput>({
    resolver: zodResolver(itemCreationSchema) as unknown as Resolver<ItemCreationInput>,
    defaultValues: {
      readyToSell: false,
      gender: "WOMEN",
    },
  });

  const readyToSell = watch("readyToSell");
  const category = watch("category");
  
  // Clear image error when images change
  useEffect(() => {
    setImageError("");
  }, [images.length]);

  // Load dynamic data on mount
  useEffect(() => {
    async function loadData() {
      const [brandsData, colorsData] = await Promise.all([
        getAllBrands(),
        getAllColors(),
      ]);
      setBrands(brandsData);
      setColors(colorsData);
    }
    loadData();
  }, []);

  // Load sizes and subcategories when category changes
  useEffect(() => {
    async function loadCategoryData() {
      if (category) {
        const [sizesData, subcategoriesData] = await Promise.all([
          getSizesByCategory(category),
          getSubcategoriesByCategory(category as ItemCategory),
        ]);
        setSizes(sizesData);
        setSubcategories(subcategoriesData);
      } else {
        setSizes([]);
        setSubcategories([]);
      }
    }
    loadCategoryData();
  }, [category]);

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

  // Handle creating new brand
  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    
    const result = await createBrand(newBrandName.trim());
    if (result.success) {
      setBrands([...brands, result.brand]);
      setValue("brand_id", result.brand.id);
      setNewBrandName("");
      setShowNewBrand(false);
    } else {
      alert("Failed to create brand: " + result.error);
    }
  };

  const onSubmit = async (data: ItemCreationInput) => {
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


      // Step 1: Compress images
      setCompressionProgress("Compressing images...");
      const compressedImages = await compressImages(images.map((img) => img.file));

      // Step 2: Upload to Supabase Storage
      setCompressionProgress("Uploading images...");
      const uploadResults = await uploadMultipleItemImages(user.id, compressedImages);

      const imageUrls = uploadResults.map((result) => result.fullImageUrl);
      const thumbnailUrl = uploadResults[0].thumbnailUrl;

      // Step 3: Create item in database
      setCompressionProgress("Saving item...");
      const result = await uploadItem(data, imageUrls, thumbnailUrl);

      if (result.error) {
        console.error("Upload item error:", result.error);
        setSubmitError(result.error);
        setIsSubmitting(false);
        return;
      }

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
            onSubmit(data);
          },
          (errors) => {
            console.error("Form validation errors:", errors);
            setSubmitError("Please check the form for errors");
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
                Description
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
                <label htmlFor="brand_id" className="block text-sm font-medium mb-2">
                  Brand
                </label>
                <div className="space-y-2">
                  <Combobox
                    options={brands.map((b) => ({ value: b.id, label: b.name }))}
                    value={watch("brand_id")}
                    onChange={(value) => setValue("brand_id", value)}
                    placeholder="Select brand"
                    searchPlaceholder="Search brands..."
                    emptyText="No brand found."
                  />
                  {!showNewBrand ? (
                    <button
                      type="button"
                      onClick={() => setShowNewBrand(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      + Create new brand
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="New brand name"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        onKeyPress={(e) => e.key === "Enter" && handleCreateBrand()}
                      />
                      <button
                        type="button"
                        onClick={handleCreateBrand}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewBrand(false);
                          setNewBrandName("");
                        }}
                        className="px-3 py-2 border rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {errors.brand_id && (
                  <p className="mt-1 text-sm text-destructive">{errors.brand_id.message}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label htmlFor="color_id" className="block text-sm font-medium mb-2">
                  Color
                </label>
                <select
                  id="color_id"
                  {...register("color_id")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select color</option>
                  {colors.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
                {errors.color_id && (
                  <p className="mt-1 text-sm text-destructive">{errors.color_id.message}</p>
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

              {/* Subcategory */}
              <div>
                <label htmlFor="subcategory_id" className="block text-sm font-medium mb-2">
                  Subcategory
                </label>
                <select
                  id="subcategory_id"
                  {...register("subcategory_id")}
                  disabled={!category}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {category ? "Select subcategory" : "Select category first"}
                  </option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
                {errors.subcategory_id && (
                  <p className="mt-1 text-sm text-destructive">{errors.subcategory_id.message}</p>
                )}
              </div>

              {/* Size */}
              <div>
                <label htmlFor="size_id" className="block text-sm font-medium mb-2">
                  Size
                </label>
                <select
                  id="size_id"
                  {...register("size_id")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select size</option>
                  {sizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.name}
                    </option>
                  ))}
                </select>
                {errors.size_id && (
                  <p className="mt-1 text-sm text-destructive">{errors.size_id.message}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium mb-2">
                  Gender *
                </label>
                <select
                  id="gender"
                  {...register("gender")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {GENDERS.map((gender) => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-destructive">{errors.gender.message}</p>
                )}
              </div>

              {/* Condition */}
              <div>
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
