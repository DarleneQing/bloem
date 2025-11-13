"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { invalidateQRCode } from "@/features/qr-batches/actions";
import { AlertCircle } from "lucide-react";

interface QRCodeInvalidationProps {
  qrCodeId: string;
  qrCode: string;
  onInvalidated?: () => void;
}

export function QRCodeInvalidation({
  qrCodeId,
  qrCode,
  onInvalidated,
}: QRCodeInvalidationProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvalidate = async () => {
    if (!reason.trim()) {
      setError("Invalidation reason is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await invalidateQRCode(qrCodeId, reason);

      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setReason("");
        if (onInvalidated) {
          onInvalidated();
        }
      }
    } catch (err) {
      setError("Failed to invalidate QR code");
      console.error("Error invalidating QR code:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Invalidate QR Code
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invalidate QR Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to invalidate this QR code? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="qr-code" className="block text-sm font-medium mb-1">
                QR Code
              </label>
              <div className="mt-1 p-2 bg-gray-50 rounded font-mono text-sm">
                {qrCode}
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium mb-1">
                Invalidation Reason *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for invalidation (e.g., 'Damaged label', 'Lost', etc.)"
                className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reason.length}/500 characters
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setReason("");
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleInvalidate}
              disabled={loading || !reason.trim()}
            >
              {loading ? "Invalidating..." : "Invalidate QR Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

