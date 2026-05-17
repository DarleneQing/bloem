"use client";

import { useState } from "react";
import { BuyerQrScanner } from "@/components/scan/buyer-qr-scanner";
import { SellerQrLinking } from "@/components/scan/seller-qr-linking";
import type { SellerLinkedItem } from "@/features/qr-codes/queries";
import { cn } from "@/lib/utils";

type ScanMode = "buy" | "link";

interface WardrobeLinkItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  status: string;
  size?: { name: string } | null;
}

interface ScanPageClientProps {
  isActiveSeller: boolean;
  code?: string;
  wardrobeItems?: WardrobeLinkItem[];
  linkedItems?: SellerLinkedItem[];
}

export function ScanPageClient({
  isActiveSeller,
  code,
  wardrobeItems = [],
  linkedItems = [],
}: ScanPageClientProps) {
  const [mode, setMode] = useState<ScanMode>("buy");

  if (!isActiveSeller) {
    return (
      <div className="-mx-4 md:mx-auto md:max-w-2xl">
        <BuyerQrScanner initialCode={code} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-30 border-b bg-background px-4 py-3 md:rounded-t-2xl">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("buy")}
            className={cn(
              "rounded-full py-2 text-sm font-semibold transition-colors",
              mode === "buy"
                ? "bg-brand-purple text-white shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Scan item
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={cn(
              "rounded-full py-2 text-sm font-semibold transition-colors",
              mode === "link"
                ? "bg-brand-purple text-white shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Link tag
          </button>
        </div>
      </div>

      {mode === "buy" ? (
        <div className="-mx-4 md:mx-0">
          <BuyerQrScanner initialCode={code} />
        </div>
      ) : (
        <SellerQrLinking
          wardrobeItems={wardrobeItems}
          linkedItems={linkedItems}
          onBack={() => setMode("buy")}
        />
      )}
    </div>
  );
}
