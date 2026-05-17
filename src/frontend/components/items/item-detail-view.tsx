"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/items/status-badge";
import { ItemDetailHero } from "@/components/items/item-detail-hero";
import { ItemDetailActionsBar } from "@/components/items/item-detail-actions-bar";
import { ItemDetailSpecs } from "@/components/items/item-detail-specs";
import { deleteItem, removeFromRack } from "@/features/items/actions";
import type { Item, ItemCondition } from "@/types/items";

interface ItemDetailViewProps {
  item: Item & {
    brand?: { name: string } | null;
    size?: { name: string } | null;
    color?: { name: string } | null;
    subcategory?: { name: string } | null;
  };
  isActiveSeller: boolean;
  wardrobeIsPublic: boolean;
  userId: string;
}

const CONDITION_LABELS: Record<ItemCondition, string> = {
  NEW_WITH_TAGS: "New with tags",
  LIKE_NEW: "Like new",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
};

function formatBrandSize(
  brand: ItemDetailViewProps["item"]["brand"],
  size: ItemDetailViewProps["item"]["size"]
) {
  const brandName = brand?.name;
  const sizeName = size?.name;
  if (brandName && sizeName) return `${brandName} • ${sizeName}`;
  return brandName ?? sizeName ?? null;
}

function formatListedDate(listedAt: string | null, createdAt: string) {
  const date = listedAt ?? createdAt;
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ItemDetailView({
  item,
  isActiveSeller,
  wardrobeIsPublic,
  userId,
}: ItemDetailViewProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const images =
    item.image_urls?.length > 0 ? item.image_urls : [item.thumbnail_url].filter(Boolean);

  const brandSize = formatBrandSize(item.brand, item.size);
  const metadataLine = [brandSize, CONDITION_LABELS[item.condition]].filter(Boolean).join(" • ");

  const canDelete = item.status !== "SOLD";
  const isInRack = item.status === "RACK";

  async function handleDelete() {
    setIsLoading(true);
    setError("");
    const result = await deleteItem(item.id);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      setShowDeleteConfirm(false);
      return;
    }
    router.push("/wardrobe");
    router.refresh();
  }

  async function handleUnlink() {
    setIsLoading(true);
    setError("");
    const result = await removeFromRack(item.id);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      setShowUnlinkConfirm(false);
      return;
    }
    setShowUnlinkConfirm(false);
    setIsLoading(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-4 md:max-w-2xl md:pb-8 md:pt-6">
      <div className="-mx-4 -mt-4 md:-mt-6">
        <ItemDetailHero
          images={images}
          title={item.title}
          showDelete={canDelete}
          showUnlink={isInRack}
          onDelete={() => setShowDeleteConfirm(true)}
          onUnlink={() => setShowUnlinkConfirm(true)}
        />
      </div>

      <div className="mt-6 space-y-6">
        <header>
          <div className="flex items-start justify-between gap-4">
            <h1 className="min-w-0 flex-1 text-[1.625rem] font-bold leading-tight tracking-tight text-foreground">
              {item.title}
            </h1>
            <StatusBadge status={item.status} variant="detail" className="mt-0.5 shrink-0" />
          </div>

          <div className="mt-3 space-y-1.5">
            {metadataLine && (
              <p className="text-base font-normal leading-snug text-foreground/70">{metadataLine}</p>
            )}

            <p className="text-sm font-normal leading-snug text-muted-foreground">
              Listed on {formatListedDate(item.listed_at, item.created_at)}
            </p>
          </div>

          {item.selling_price != null && (
            <p className="mt-4 text-xl font-bold leading-none tabular-nums tracking-tight text-primary">
              CHF {item.selling_price.toFixed(2)}
            </p>
          )}
        </header>

        {error && (
          <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
        )}

        <ItemDetailActionsBar item={item} isActiveSeller={isActiveSeller} />

        <ItemDetailSpecs item={item} />

        {wardrobeIsPublic ? (
          <Button asChild className="h-12 w-full rounded-full text-base font-semibold">
            <Link href={`/wardrobe/user/${userId}`}>View on Public Wardrobe</Link>
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Turn on public wardrobe in profile settings to share your collection.
          </p>
        )}
      </div>

      {showUnlinkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6">
            <h3 className="text-lg font-semibold">Unlink item?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This moves the item back to display and frees the QR code for another item.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleUnlink} variant="destructive" disabled={isLoading}>
                {isLoading ? "Unlinking…" : "Unlink"}
              </Button>
              <Button
                onClick={() => {
                  setShowUnlinkConfirm(false);
                  setError("");
                }}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6">
            <h3 className="text-lg font-semibold">Delete item?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleDelete} variant="destructive" disabled={isLoading}>
                {isLoading ? "Deleting…" : "Delete"}
              </Button>
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError("");
                }}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
