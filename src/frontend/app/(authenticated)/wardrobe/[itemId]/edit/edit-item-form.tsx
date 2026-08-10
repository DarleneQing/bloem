"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UploadItemHeader } from "@/components/items/upload/upload-item-header";
import { UploadFormField, UploadSelect } from "@/components/items/upload/upload-form-field";
import { UploadBrandSelect } from "@/components/items/upload/upload-brand-select";
import { itemUpdateSchema, type ItemUpdateInput } from "@/lib/validations/schemas";
import { updateItem } from "@/features/items/actions";
import type { EnrichedItem } from "@/features/items/queries";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, GENDERS, ITEM_FITS } from "@/types/items";
import { getAllBrands } from "@/lib/data/brands";
import { getAllColors } from "@/lib/data/colors";
import { getSizesByCategory } from "@/lib/data/sizes";
import { getSubcategoriesByCategory } from "@/lib/data/subcategories";
import type { Brand, Color, Size, Subcategory, ItemCategory } from "@/types/items";
import { cn } from "@/lib/utils";

const DESCRIPTION_MAX = 1000;

interface EditItemFormProps {
  item: EnrichedItem;
  isActiveSeller: boolean;
}

export function EditItemForm({ item, isActiveSeller }: EditItemFormProps) {
  const router = useRouter();
  const isListedForSale = item.status === "RACK" || item.status === "RESERVED";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [readyToSell, setReadyToSell] = useState(
    isListedForSale || (item.selling_price != null && item.selling_price > 0),
  );
  const [brands, setBrands] = useState<Brand[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ItemUpdateInput>({
    resolver: zodResolver(itemUpdateSchema) as unknown as Resolver<ItemUpdateInput>,
    defaultValues: {
      gender: "WOMEN",
    },
  });

  const category = watch("category");
  const description = watch("description") ?? "";
  const sellingPrice = watch("sellingPrice");
  const previousCategory = useRef<string | undefined>();

  useEffect(() => {
    async function loadStaticData() {
      const [brandsData, colorsData] = await Promise.all([getAllBrands(), getAllColors()]);
      setBrands(brandsData);
      setColors(colorsData);
    }

    loadStaticData();
  }, []);

  useEffect(() => {
    reset({
      title: item.title,
      description: item.description || "",
      brand_id: item.brand_id || "",
      category: item.category,
      size_id: item.size_id || "",
      condition: item.condition,
      color_id: item.color_id || "",
      subcategory_id: item.subcategory_id || "",
      gender: item.gender,
      fit: item.fit || undefined,
      purchasePrice: item.purchase_price || undefined,
      sellingPrice: item.selling_price || undefined,
    });

    async function loadCategoryData() {
      if (!item.category) {
        return;
      }

      const [sizesData, subcategoriesData] = await Promise.all([
        getSizesByCategory(item.category),
        getSubcategoriesByCategory(item.category),
      ]);
      setSizes(sizesData);
      setSubcategories(subcategoriesData);
    }

    loadCategoryData();
  }, [item, reset]);

  useEffect(() => {
    async function loadCategoryData() {
      if (!category) {
        setSizes([]);
        setSubcategories([]);
        return;
      }

      const [sizesData, subcategoriesData] = await Promise.all([
        getSizesByCategory(category),
        getSubcategoriesByCategory(category as ItemCategory),
      ]);
      setSizes(sizesData);
      setSubcategories(subcategoriesData);
    }

    loadCategoryData();
  }, [category]);

  useEffect(() => {
    if (previousCategory.current !== undefined && previousCategory.current !== category) {
      setValue("subcategory_id", "");
      setValue("size_id", "");
    }
    previousCategory.current = category;
  }, [category, setValue]);

  const onSubmit = async (data: ItemUpdateInput) => {
    setSubmitError("");

    if (!isListedForSale && readyToSell) {
      if (!isActiveSeller) {
        setSubmitError("Verify your seller account before listing items for sale.");
        return;
      }
      if (!sellingPrice || sellingPrice < 0.01) {
        setSubmitError("Enter a selling price to list this item for sale.");
        return;
      }
    }

    const payload: ItemUpdateInput = {
      ...data,
      sellingPrice:
        isListedForSale || readyToSell ? data.sellingPrice : undefined,
    };

    setIsSubmitting(true);
    const result = await updateItem(item.id, payload);

    if (result.error) {
      setSubmitError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.push(`/wardrobe/${item.id}`);
    router.refresh();
  };

  const cardClass = "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm";
  const showSellingPriceField = isListedForSale || (readyToSell && isActiveSeller);

  return (
    <div className="mx-auto max-w-lg px-4 pb-32 pt-2 md:max-w-2xl">
      <UploadItemHeader title="Edit Item" />

      <form
        onSubmit={handleSubmit(onSubmit, () => {
          setSubmitError("Please check the form for errors");
        })}
        className="space-y-4"
      >
        <section className={cn(cardClass, "p-4")}>
          <p className="text-sm text-muted-foreground">
            Photos cannot be changed after upload. To use different images, delete this item and
            upload a new one.
          </p>
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
            <UploadBrandSelect
              brands={brands}
              value={watch("brand_id")}
              onChange={(brandId) => setValue("brand_id", brandId)}
              onBrandsChange={setBrands}
              onError={setSubmitError}
            />
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
              onValueChange={(v) => setValue("category", v as ItemUpdateInput["category"])}
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
              onValueChange={(v) => setValue("gender", v as ItemUpdateInput["gender"])}
              placeholder="Select gender"
              options={GENDERS.map((gender) => ({ value: gender.value, label: gender.label }))}
            />
          </UploadFormField>

          <UploadFormField label="Fit (optional)" error={errors.fit?.message}>
            <UploadSelect
              value={watch("fit") ?? ""}
              onValueChange={(v) => setValue("fit", v as ItemUpdateInput["fit"])}
              placeholder="Select fit"
              options={ITEM_FITS.map((fit) => ({ value: fit.value, label: fit.label }))}
            />
          </UploadFormField>

          <UploadFormField label="Condition" error={errors.condition?.message}>
            <UploadSelect
              value={watch("condition") ?? ""}
              onValueChange={(v) => setValue("condition", v as ItemUpdateInput["condition"])}
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
          <UploadFormField
            label="Original Price"
            className={showSellingPriceField || (isActiveSeller && !isListedForSale) ? "" : "!border-b-0"}
          >
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
              {isActiveSeller && !isListedForSale && (
                <label className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Ready to sell</span>
                  <Switch
                    checked={readyToSell}
                    onCheckedChange={(checked) => {
                      setSubmitError("");
                      setReadyToSell(checked);
                      if (!checked) {
                        setValue("sellingPrice", undefined);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </UploadFormField>

          {showSellingPriceField && (
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

        <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button
            type="submit"
            className="h-12 w-full rounded-full text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
