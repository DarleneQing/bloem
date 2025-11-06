"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { itemUpdateSchema, type ItemUpdateInput } from "@/lib/validations/schemas";
import { updateItem } from "@/features/items/actions";
import { getItemById, type EnrichedItem } from "@/features/items/queries";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, GENDERS } from "@/types/items";
import { getAllBrands, createBrand } from "@/lib/data/brands";
import { getAllColors } from "@/lib/data/colors";
import { getSizesByCategory } from "@/lib/data/sizes";
import { getSubcategoriesByCategory } from "@/lib/data/subcategories";
import type { Brand, Color, Size, Subcategory } from "@/types/items";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.itemId as string;

  const [item, setItem] = useState<EnrichedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  
  // State for dynamic data loading
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
    reset,
    watch,
    setValue,
  } = useForm<ItemUpdateInput>({
    resolver: zodResolver(itemUpdateSchema) as unknown as Resolver<ItemUpdateInput>,
    mode: "onBlur",
    defaultValues: {
      gender: "WOMEN",
    },
  });

  const category = watch("category");

  // Load brands and colors on mount
  useEffect(() => {
    async function loadStaticData() {
      const [brandsData, colorsData] = await Promise.all([
        getAllBrands(),
        getAllColors(),
      ]);
      setBrands(brandsData);
      setColors(colorsData);
    }

    loadStaticData();
  }, []);

  // Load sizes and subcategories when category changes
  useEffect(() => {
    async function loadDynamicData() {
      if (!category) {
        setSizes([]);
        setSubcategories([]);
        return;
      }

      const [sizesData, subcategoriesData] = await Promise.all([
        getSizesByCategory(category),
        getSubcategoriesByCategory(category),
      ]);
      setSizes(sizesData);
      setSubcategories(subcategoriesData);
    }

    loadDynamicData();
  }, [category]);

  useEffect(() => {
    async function loadItem() {
      const data = await getItemById(itemId);

      if (!data) {
        router.push("/wardrobe");
        return;
      }

      setItem(data);

      // Pre-fill form with new foreign key fields
      reset({
        title: data.title,
        description: data.description || "",
        brand_id: data.brand_id || "",
        category: data.category,
        size_id: data.size_id || "",
        condition: data.condition,
        color_id: data.color_id || "",
        subcategory_id: data.subcategory_id || "",
        gender: data.gender,
      });

      // Load sizes and subcategories for the item's category
      if (data.category) {
        const [sizesData, subcategoriesData] = await Promise.all([
          getSizesByCategory(data.category),
          getSubcategoriesByCategory(data.category),
        ]);
        setSizes(sizesData);
        setSubcategories(subcategoriesData);
      }

      setIsLoading(false);
    }

    loadItem();
  }, [itemId, reset, router]);

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

  const onSubmit = async (data: ItemUpdateInput) => {
    setSubmitError("");
    setIsSubmitting(true);

    const result = await updateItem(itemId, data);

    if (result.error) {
      setSubmitError(result.error);
      setIsSubmitting(false);
    } else {
      router.push(`/wardrobe/${itemId}`);
      router.refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <p className="text-center text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Item</h1>
        <p className="text-muted-foreground">Update item details</p>
      </div>

      <form 
        onSubmit={handleSubmit(
          onSubmit,
          (errors) => {
            console.error("Form validation errors:", errors);
            setSubmitError("Please check the form for errors");
          }
        )}
        className="space-y-8"
      >
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

        {/* Current Images Info */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Note: You cannot change item images after upload. To change images, delete this item
            and upload a new one.
          </p>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
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

