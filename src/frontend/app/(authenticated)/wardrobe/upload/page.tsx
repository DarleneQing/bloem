"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUploader } from "@/components/items/image-uploader";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { UploadItemHeader } from "@/components/items/upload/upload-item-header";
import { UploadFormField, UploadSelect } from "@/components/items/upload/upload-form-field";
import { itemCreationSchema, type ItemCreationInput, validateImageFiles } from "@/lib/validations/schemas";
import { uploadItem, moveItemToRack } from "@/features/items/actions";
import { compressImages } from "@/lib/image/compression";
import { uploadMultipleItemImages } from "@/lib/storage/upload";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, GENDERS } from "@/types/items";
import { createClient } from "@/lib/supabase/client";
import { getAllBrands, createBrand } from "@/lib/data/brands";
import { getAllColors } from "@/lib/data/colors";
import { getSizesByCategory } from "@/lib/data/sizes";
import { getSubcategoriesByCategory } from "@/lib/data/subcategories";
import type { Brand, Color, Size, Subcategory, ItemCategory } from "@/types/items";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 5;
const DESCRIPTION_MAX = 1000;

interface ImageFile {
  file: File;
  preview: string;
}

export default function UploadItemPage() {
  const router = useRouter();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [imageError, setImageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [compressionProgress, setCompressionProgress] = useState("");
  const [readyToSell, setReadyToSell] = useState(false);
  const [isActiveSeller, setIsActiveSeller] = useState(false);
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
      gender: "WOMEN",
    },
  });

  const category = watch("category");
  const description = watch("description") ?? "";
  const sellingPrice = watch("sellingPrice");

  useEffect(() => {
    setImageError("");
  }, [images.length]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const [brandsData, colorsData, { data: profile }] = await Promise.all([
        getAllBrands(),
        getAllColors(),
        supabase.from("profiles").select("iban_verified_at").single(),
      ]);
      setBrands(brandsData);
      setColors(colorsData);
      setIsActiveSeller(!!profile?.iban_verified_at);
    }
    loadData();
  }, []);

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

  useEffect(() => {
    setValue("subcategory_id", "");
    setValue("size_id", "");
  }, [category, setValue]);

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;

    const result = await createBrand(newBrandName.trim());
    if (result.success) {
      setBrands([...brands, result.brand]);
      setValue("brand_id", result.brand.id);
      setNewBrandName("");
      setShowNewBrand(false);
    } else {
      setSubmitError("Failed to create brand: " + result.error);
    }
  };

  const onSubmit = async (data: ItemCreationInput) => {
    setSubmitError("");
    setImageError("");

    if (readyToSell) {
      if (!isActiveSeller) {
        setSubmitError("Verify your seller account before listing items for sale.");
        return;
      }
      if (!sellingPrice || sellingPrice < 0.01) {
        setSubmitError("Enter a selling price to list this item for sale.");
        return;
      }
    }

    try {
      validateImageFiles(images.map((img) => img.file));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Invalid images");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setSubmitError(userError?.message ?? "Not authenticated. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      const payload: ItemCreationInput = {
        ...data,
        sellingPrice: readyToSell ? sellingPrice : undefined,
      };

      setCompressionProgress("Compressing images...");
      const compressedImages = await compressImages(images.map((img) => img.file));

      setCompressionProgress("Uploading images...");
      const uploadResults = await uploadMultipleItemImages(user.id, compressedImages);
      const imageUrls = uploadResults.map((result) => result.fullImageUrl);
      const thumbnailUrl = uploadResults[0].thumbnailUrl;

      setCompressionProgress("Saving item...");
      const result = await uploadItem(payload, imageUrls, thumbnailUrl);

      if (result.error) {
        setSubmitError(result.error);
        setIsSubmitting(false);
        setCompressionProgress("");
        return;
      }

      if (readyToSell && result.item?.id && sellingPrice) {
        setCompressionProgress("Preparing for sale...");
        const rackResult = await moveItemToRack({
          itemId: result.item.id,
          sellingPrice,
        });
        if (rackResult.error) {
          setSubmitError(rackResult.error);
          setIsSubmitting(false);
          setCompressionProgress("");
          return;
        }
      }

      setCompressionProgress("Success! Redirecting...");
      setTimeout(() => {
        router.push("/wardrobe");
        router.refresh();
      }, 400);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to upload item. Please try again.");
      setIsSubmitting(false);
      setCompressionProgress("");
    }
  };

  const cardClass = "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm";

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-2 md:max-w-xl">
      <UploadItemHeader />

      <form
        onSubmit={handleSubmit(onSubmit, () => {
          setSubmitError("Please check the form for errors");
        })}
        className="space-y-4"
      >
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Add Photos</h2>
            <span className="text-xs text-muted-foreground">
              {images.length}/{MAX_PHOTOS}
            </span>
          </div>
          <ImageUploader
            images={images}
            onImagesChange={setImages}
            maxImages={MAX_PHOTOS}
            error={imageError}
            variant="strip"
          />
        </section>

        <section className={cardClass}>
          <UploadFormField label="Title" error={errors.title?.message}>
            <input
              id="title"
              type="text"
              {...register("title")}
              placeholder="e.g. Vintage Levi's denim jacket"
              className="form-control-inline"
            />
          </UploadFormField>

          <UploadFormField label="Brand" error={errors.brand_id?.message}>
            <Combobox
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
              value={watch("brand_id")}
              onChange={(value) => setValue("brand_id", value)}
              placeholder="Select brand"
              searchPlaceholder="Search brands..."
              emptyText="No brand found."
              variant="inline"
            />
            {!showNewBrand ? (
              <button
                type="button"
                onClick={() => setShowNewBrand(true)}
                className="mt-2 text-xs font-medium text-brand-purple"
              >
                + Add new brand
              </button>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Brand name"
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateBrand())}
                />
                <button
                  type="button"
                  onClick={handleCreateBrand}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                >
                  Save
                </button>
              </div>
            )}
          </UploadFormField>

          <UploadFormField label="Color" error={errors.color_id?.message}>
            <UploadSelect
              value={watch("color_id") ?? ""}
              onValueChange={(v) => setValue("color_id", v)}
              placeholder="Select color"
              options={colors.map((color) => ({ value: color.id, label: color.name }))}
            />
          </UploadFormField>

          <UploadFormField label="Category" error={errors.category?.message}>
            <UploadSelect
              value={watch("category") ?? ""}
              onValueChange={(v) => setValue("category", v as ItemCreationInput["category"])}
              placeholder="Select category"
              options={ITEM_CATEGORIES.map((cat) => ({ value: cat.value, label: cat.label }))}
            />
          </UploadFormField>

          <UploadFormField label="Subcategory" error={errors.subcategory_id?.message}>
            <UploadSelect
              value={watch("subcategory_id") ?? ""}
              onValueChange={(v) => setValue("subcategory_id", v)}
              placeholder={category ? "Select subcategory" : "Choose category first"}
              options={subcategories.map((subcategory) => ({
                value: subcategory.id,
                label: subcategory.name,
              }))}
              disabled={!category}
            />
          </UploadFormField>

          <UploadFormField label="Size" error={errors.size_id?.message}>
            <UploadSelect
              value={watch("size_id") ?? ""}
              onValueChange={(v) => setValue("size_id", v)}
              placeholder={category ? "Select size" : "Choose category first"}
              options={sizes.map((size) => ({ value: size.id, label: size.name }))}
              disabled={!category}
            />
          </UploadFormField>

          <UploadFormField label="Gender" error={errors.gender?.message}>
            <UploadSelect
              value={watch("gender") ?? "WOMEN"}
              onValueChange={(v) => setValue("gender", v as ItemCreationInput["gender"])}
              placeholder="Select gender"
              options={GENDERS.map((gender) => ({ value: gender.value, label: gender.label }))}
            />
          </UploadFormField>

          <UploadFormField label="Condition" error={errors.condition?.message}>
            <UploadSelect
              value={watch("condition") ?? ""}
              onValueChange={(v) => setValue("condition", v as ItemCreationInput["condition"])}
              placeholder="Select condition"
              options={ITEM_CONDITIONS.map((cond) => ({ value: cond.value, label: cond.label }))}
            />
          </UploadFormField>

          <UploadFormField label="Description" error={errors.description?.message} className="!border-b-0">
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              maxLength={DESCRIPTION_MAX}
              placeholder="Describe the item, its condition, fit, and any special features…"
              className="form-control-inline resize-none"
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {description.length}/{DESCRIPTION_MAX}
            </p>
          </UploadFormField>
        </section>

        <section className={cardClass}>
          <UploadFormField label="Original Price" className={readyToSell ? "" : "!border-b-0"}>
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex min-w-0 flex-1 items-center">
                <span className="mr-1 text-base font-medium text-muted-foreground">CHF</span>
                <input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("purchasePrice", { valueAsNumber: true })}
                  placeholder="0"
                  className="form-control-inline"
                />
              </div>
              <label className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Ready to sell</span>
                <Switch
                  checked={readyToSell}
                  onCheckedChange={(checked) => {
                    if (checked && !isActiveSeller) {
                      setSubmitError("Verify your seller account to list items for sale.");
                      return;
                    }
                    setSubmitError("");
                    setReadyToSell(checked);
                  }}
                />
              </label>
            </div>
          </UploadFormField>

          {readyToSell && (
            <UploadFormField label="Selling Price" error={errors.sellingPrice?.message} className="!border-b-0">
              <div className="flex items-center">
                <span className="mr-1 text-base font-medium text-muted-foreground">CHF</span>
                <input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("sellingPrice", { valueAsNumber: true })}
                  placeholder="0"
                  className="form-control-inline"
                />
              </div>
            </UploadFormField>
          )}
        </section>

        {submitError && (
          <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{submitError}</div>
        )}

        {compressionProgress && (
          <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">{compressionProgress}</div>
        )}

        <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <button
            type="submit"
            disabled={isSubmitting || images.length === 0}
            className={cn(
              "flex h-12 w-full items-center justify-center rounded-full bg-brand-purple text-base font-semibold text-white transition-opacity",
              "hover:bg-brand-purple/90 disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            {isSubmitting ? "Publishing…" : "Publish Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
