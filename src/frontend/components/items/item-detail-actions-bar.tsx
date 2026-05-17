"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Pencil,
  QrCode,
  Share2,
} from "lucide-react";
import type { Item } from "@/types/items";
import { markItemAsSold } from "@/features/items/actions";
import { QRCodeLinkingDialog } from "@/components/qr-codes/QRCodeLinkingDialog";
import {
  LinkedQRCodeDialog,
  type LinkedQRCodeSummary,
} from "@/components/qr-codes/LinkedQRCodeDialog";
import { getQRCodeBaseURL } from "@/lib/qr/generation";

interface ItemDetailActionsBarProps {
  item: Item;
  isActiveSeller: boolean;
  linkedQRCode?: LinkedQRCodeSummary | null;
}

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

function ActionButton({ label, icon, onClick, href, disabled }: ActionButtonProps) {
  const content = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-foreground">
        {icon}
      </span>
      <span className="text-center text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </span>
    </>
  );

  const className =
    "flex flex-col items-center gap-1.5 py-1 disabled:opacity-40 disabled:pointer-events-none";

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

export function ItemDetailActionsBar({
  item,
  isActiveSeller,
  linkedQRCode = null,
}: ItemDetailActionsBarProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLinkingDialog, setShowLinkingDialog] = useState(false);
  const [showLinkedQRDialog, setShowLinkedQRDialog] = useState(false);

  const isSold = item.status === "SOLD";
  const isInRack = item.status === "RACK";
  const canEdit = !isSold;
  const canMarkSold = isActiveSeller && isInRack;
  const canLinkOrViewQr =
    isActiveSeller &&
    (linkedQRCode != null || item.status === "WARDROBE" || (isInRack && !isSold));

  async function handleMarkSold() {
    if (!canMarkSold) return;

    setIsLoading(true);
    setError("");

    const result = await markItemAsSold(item.id);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    router.refresh();
  }

  async function handleShare() {
    const url = `${getQRCodeBaseURL()}/wardrobe/${item.id}`;
    const shareData = {
      title: item.title,
      text: `Check out ${item.title} on Bloem`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError("Could not share this item");
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-1">
          <ActionButton
            label="Edit"
            icon={<Pencil className="h-4 w-4" />}
            href={canEdit ? `/wardrobe/${item.id}/edit` : undefined}
            disabled={!canEdit || isLoading}
          />
          <ActionButton
            label="Mark Sold"
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={handleMarkSold}
            disabled={!canMarkSold || isLoading}
          />
          <ActionButton
            label={linkedQRCode ? "View QR" : "Link QR"}
            icon={<QrCode className="h-4 w-4" />}
            onClick={() => {
              setError("");
              if (linkedQRCode) {
                setShowLinkedQRDialog(true);
              } else {
                setShowLinkingDialog(true);
              }
            }}
            disabled={!canLinkOrViewQr || isLoading}
          />
          <ActionButton
            label="Share"
            icon={<Share2 className="h-4 w-4" />}
            onClick={handleShare}
            disabled={isLoading}
          />
        </div>
      </div>

      <QRCodeLinkingDialog
        open={showLinkingDialog}
        onOpenChange={setShowLinkingDialog}
        preselectedItemId={item.id}
      />

      {linkedQRCode && (
        <LinkedQRCodeDialog
          open={showLinkedQRDialog}
          onOpenChange={setShowLinkedQRDialog}
          linkedQRCode={linkedQRCode}
        />
      )}
    </div>
  );
}
