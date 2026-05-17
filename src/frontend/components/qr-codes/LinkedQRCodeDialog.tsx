"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateQRCodeImage } from "@/lib/qr/generation";

export interface LinkedQRCodeSummary {
  id: string;
  code: string;
  status: string;
  linked_at: string | null;
}

interface LinkedQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkedQRCode: LinkedQRCodeSummary;
}

export function LinkedQRCodeDialog({
  open,
  onOpenChange,
  linkedQRCode,
}: LinkedQRCodeDialogProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setQrImage(null);
      setImageError("");
      setCopyMessage("");
      return;
    }

    let cancelled = false;

    generateQRCodeImage(linkedQRCode.code)
      .then((dataUrl) => {
        if (!cancelled) {
          setQrImage(dataUrl);
          setImageError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImageError("Could not generate QR preview");
          setQrImage(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, linkedQRCode.code]);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(linkedQRCode.code);
      setCopyMessage("Code copied");
    } catch {
      setCopyMessage("Could not copy code");
    }
  }

  const linkedDate = linkedQRCode.linked_at
    ? new Date(linkedQRCode.linked_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Linked QR Code</DialogTitle>
          <DialogDescription>
            This item is linked to the QR code below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex min-h-[220px] w-full items-center justify-center rounded-2xl border border-border/60 bg-muted/30 p-4">
            {qrImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrImage}
                alt={`QR code for ${linkedQRCode.code}`}
                className="h-[200px] w-[200px] rounded-lg bg-white p-2"
              />
            ) : imageError ? (
              <p className="text-sm text-destructive">{imageError}</p>
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="w-full space-y-2 text-center">
            <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
              {linkedQRCode.code}
            </p>
            {linkedDate && (
              <p className="text-xs text-muted-foreground">Linked on {linkedDate}</p>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={handleCopyCode}>
              <Copy className="mr-2 h-4 w-4" />
              Copy code
            </Button>
            <Button asChild className="flex-1">
              <Link href={`/qr/${encodeURIComponent(linkedQRCode.code)}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open item page
              </Link>
            </Button>
          </div>

          {copyMessage && <p className="text-center text-xs text-muted-foreground">{copyMessage}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}