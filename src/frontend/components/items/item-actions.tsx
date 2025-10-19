"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Item } from "@/types/items";
import { moveItemToRack, removeFromRack, deleteItem } from "@/features/items/actions";

interface ItemActionsProps {
  item: Item;
  isActiveSeller: boolean;
}

export function ItemActions({ item, isActiveSeller }: ItemActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [sellingPrice, setSellingPrice] = useState<number>(item.selling_price || 0);

  // Removed unused handleTogglePrivacy to satisfy build

  const handleMoveToRack = async () => {
    if (!sellingPrice || sellingPrice < 1) {
      setError("Please enter a valid price");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await moveItemToRack({
      itemId: item.id,
      sellingPrice,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setShowPriceDialog(false);
      router.refresh();
    }
  };

  const handleRemoveFromRack = async () => {
    setIsLoading(true);
    setError("");

    const result = await removeFromRack(item.id);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.refresh();
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError("");

    const result = await deleteItem(item.id);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      setShowDeleteConfirm(false);
    } else {
      router.push("/wardrobe");
      router.refresh();
    }
  };

  const canDelete = item.status !== "SOLD";
  const canMoveToRack = isActiveSeller && item.status === "WARDROBE";
  const isInRack = item.status === "RACK";

  return (
    <div className="space-y-4">
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Actions</h3>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {/* Edit */}
          {item.status !== "SOLD" && (
            <Button asChild variant="outline" disabled={isLoading}>
              <Link href={`/wardrobe/${item.id}/edit`}>Edit Item</Link>
            </Button>
          )}

          {/* Move to Rack / Remove from Rack */}
          {canMoveToRack && (
            <Button onClick={() => setShowPriceDialog(true)} disabled={isLoading}>
              Ready to Sell
            </Button>
          )}

          {isInRack && (
            <Button onClick={handleRemoveFromRack} variant="outline" disabled={isLoading}>
              Remove from Rack
            </Button>
          )}

          {/* Delete */}
          {canDelete && (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="destructive"
              disabled={isLoading}
            >
              Delete Item
            </Button>
          )}

          {item.status === "SOLD" && (
            <p className="text-sm text-muted-foreground">
              This item has been sold and cannot be edited or deleted.
            </p>
          )}
        </div>
      </div>

      {/* Price Dialog */}
      {showPriceDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Set Selling Price</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the price you want to sell this item for at markets (€1-€1000).
            </p>

            <div className="mb-6">
              <label htmlFor="price" className="block text-sm font-medium mb-2">
                Price (€)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="1"
                max="1000"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleMoveToRack} disabled={isLoading}>
                {isLoading ? "Moving..." : "Move to Rack"}
              </Button>
              <Button
                onClick={() => {
                  setShowPriceDialog(false);
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

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Delete Item?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button onClick={handleDelete} variant="destructive" disabled={isLoading}>
                {isLoading ? "Deleting..." : "Delete"}
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

