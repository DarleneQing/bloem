"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { itemUpdateSchema, type ItemUpdateInput } from "@/features/items/validations";
import { updateItem } from "@/features/items/actions";
import { getItemById } from "@/features/items/queries";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, ITEM_SIZES } from "@/types/items";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.itemId as string;

  const [item, setItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ItemUpdateInput>({
    resolver: zodResolver(itemUpdateSchema),
  });

  useEffect(() => {
    async function loadItem() {
      const data = await getItemById(itemId);

      if (!data) {
        router.push("/wardrobe");
        return;
      }

      setItem(data);

      // Pre-fill form
      reset({
        title: data.title,
        description: data.description,
        brand: data.brand || undefined,
        category: data.category,
        size: data.size || undefined,
        condition: data.condition,
        color: data.color || undefined,
      });

      setIsLoading(false);
    }

    loadItem();
  }, [itemId, reset, router]);

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

