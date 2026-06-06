"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Mobile-only "+" trigger that lives in the QR management page header, to the
 * left of the download icon. It dispatches a `CustomEvent` that the
 * `QRBatchManagement` client component listens for to open the create-batch
 * dialog. This decouples the server-rendered header from the client component
 * that owns the create-form state (issue #30).
 */
export const QR_CREATE_BATCH_EVENT = "qr:create-batch";

export function QRCreateBatchTrigger() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="shrink-0 rounded-full md:hidden"
      aria-label="Create batch"
      onClick={() => window.dispatchEvent(new CustomEvent(QR_CREATE_BATCH_EVENT))}
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
}
