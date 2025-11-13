"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Item } from "@/types/items";
import { removeFromRack, deleteItem } from "@/features/items/actions";
import { QRCodeLinkingDialog } from "@/components/qr-codes/QRCodeLinkingDialog";

interface ItemActionsProps {
  item: Item;
  isActiveSeller: boolean;
}

export function ItemActions({ item, isActiveSeller }: ItemActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showLinkingDialog, setShowLinkingDialog] = useState(false);

  // Removed unused handleTogglePrivacy to satisfy build

  const handleRemoveFromRack = async () => {
    setIsLoading(true);
    setError("");

    const result = await removeFromRack(item.id);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      setShowUnlinkConfirm(false);
    } else {
      setShowUnlinkConfirm(false);
      setIsLoading(false);
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
            <Button
              onClick={() => {
                setError("");
                setShowLinkingDialog(true);
              }}
              disabled={isLoading}
            >
              Ready to Sell
            </Button>
          )}

          {isInRack && (
            <Button onClick={() => setShowUnlinkConfirm(true)} variant="outline" disabled={isLoading}>
              Unlink Item
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

      {/* Unlink Confirmation */}
      {showUnlinkConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Unlink Item?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to unlink this item from its QR code? The item will be moved back to your wardrobe and the QR code will be available for linking to another item.
            </p>

            <div className="flex gap-3">
              <Button onClick={handleRemoveFromRack} variant="destructive" disabled={isLoading}>
                {isLoading ? "Unlinking..." : "Unlink"}
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
      <QRCodeLinkingDialog
        open={showLinkingDialog}
        onOpenChange={(open) => {
          setShowLinkingDialog(open);
        }}
        preselectedItemId={item.id}
      />
    </div>
  );
}

