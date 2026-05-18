"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ItemListing, type AdminItem } from "./ItemListing";
import { ItemDetailView } from "./ItemDetailView";
import { AdminItemsPageHeader } from "./AdminItemsPageHeader";
import { type ItemStatus } from "@/types/items";

export function AdminItemManagement() {
  const [selectedItem, setSelectedItem] = useState<AdminItem | null>(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AdminItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const handleViewItem = (item: AdminItem) => {
    setSelectedItem(item);
    setShowItemDialog(true);
  };

  const handleDeleteItem = (item: AdminItem) => {
    setItemToDelete(item);
  };

  const handleStatusChange = (_itemId: string, newStatus: ItemStatus) => {
    setListRefreshKey((k) => k + 1);
    setSuccessMessage(`Item status updated to ${newStatus}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/admin/items?itemId=${itemToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage("Item deleted successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
        setListRefreshKey((k) => k + 1);
      }
    } finally {
      setItemToDelete(null);
      setSelectedItem(null);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch("/api/admin/items?limit=5000");
      const data = await response.json();
      if (!data.success || !data.data?.items) return;

      const rows = data.data.items as AdminItem[];
      const header = ["id", "title", "status", "brand", "price", "owner", "created_at"];
      const csvLines = [
        header.join(","),
        ...rows.map((row) =>
          [
            row.id,
            `"${row.title.replace(/"/g, '""')}"`,
            row.status,
            row.brand ?? "",
            row.selling_price ?? "",
            `"${row.owner.first_name} ${row.owner.last_name}"`,
            row.created_at,
          ].join(",")
        ),
      ];

      const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bloem-items-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 md:max-w-2xl lg:max-w-3xl">
      <AdminItemsPageHeader onExport={handleExport} isExporting={isExporting} />

      <ItemListing
        key={listRefreshKey}
        onViewItem={handleViewItem}
        onDeleteItem={handleDeleteItem}
        onStatusChange={handleStatusChange}
      />

      {successMessage ? (
        <div
          className="fixed right-4 top-4 z-50 rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-2 text-sm font-medium text-foreground shadow-lg"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      <ItemDetailView
        item={selectedItem}
        isOpen={showItemDialog}
        onClose={() => {
          setShowItemDialog(false);
          setSelectedItem(null);
        }}
        onDelete={handleDeleteItem}
        onStatusChange={(itemId, newStatus) => {
          handleStatusChange(itemId, newStatus);
        }}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.title}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
