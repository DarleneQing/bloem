"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { linkQRCodeToItem } from "@/features/qr-codes/actions";
import type { SellerLinkedItem } from "@/features/qr-codes/queries";
import { parseScannedQRCode } from "@/lib/qr/parse-scanned-code";
import { cn } from "@/lib/utils";
import type { QRCodeScanResult } from "@/types/qr-codes";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleHelp,
  Loader2,
  Package,
  QrCode,
} from "lucide-react";

const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => ({ default: mod.Scanner })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-brand-lavender/20 text-sm text-muted-foreground">
        Loading camera...
      </div>
    ),
  }
);

type InputMode = "scan" | "manual";

interface WardrobeLinkItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  status: string;
  size?: { name: string } | null;
}

interface SellerQrLinkingProps {
  wardrobeItems: WardrobeLinkItem[];
  linkedItems: SellerLinkedItem[];
  onBack?: () => void;
}

function itemStatusLabel(status: string): string {
  if (status === "RACK") return "For Sale";
  if (status === "WARDROBE") return "Wardrobe";
  if (status === "SOLD") return "Sold";
  return status;
}

export function SellerQrLinking({
  wardrobeItems,
  linkedItems: initialLinkedItems,
  onBack,
}: SellerQrLinkingProps) {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>("scan");
  const [manualCode, setManualCode] = useState("");
  const [scannedQRCode, setScannedQRCode] = useState<QRCodeScanResult | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [linkedItems, setLinkedItems] = useState(initialLinkedItems);

  const resolveCode = useCallback(async (raw: string) => {
    setError(null);
    setSuccess(false);
    setSelectedItemId(null);

    const code = parseScannedQRCode(raw);
    if (!code) {
      setError("Invalid QR code format. Expected: BLOEM-PREFIX-00001");
      return;
    }

    try {
      const response = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to scan QR code");
        return;
      }

      const scanResult: QRCodeScanResult = {
        qrCode: data.data.qrCode,
        market: data.data.market,
        item: data.data.item,
        canLink:
          data.data.qrCode.status === "UNUSED" && !data.data.qrCode.invalidated_at,
        reason:
          data.data.qrCode.status !== "UNUSED"
            ? `QR code is already ${data.data.qrCode.status.toLowerCase()}`
            : data.data.qrCode.invalidated_at
              ? "QR code has been invalidated"
              : undefined,
      };

      setScannedQRCode(scanResult);
    } catch {
      setError("Failed to scan QR code");
    }
  }, []);

  const handleLink = async () => {
    if (!scannedQRCode?.canLink || !selectedItemId) {
      setError("Select an item to link");
      return;
    }

    setLinking(true);
    setError(null);

    const result = await linkQRCodeToItem({
      qrCodeId: scannedQRCode.qrCode.id,
      itemId: selectedItemId,
    });

    setLinking(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const linkedItem = wardrobeItems.find((item) => item.id === selectedItemId);
    if (linkedItem) {
      setLinkedItems((current) => [
        {
          id: scannedQRCode.qrCode.id,
          code: scannedQRCode.qrCode.code,
          linked_at: new Date().toISOString(),
          item: {
            id: linkedItem.id,
            title: linkedItem.title,
            thumbnail_url: linkedItem.thumbnail_url,
            status: linkedItem.status,
            size: linkedItem.size ?? null,
          },
        },
        ...current,
      ].slice(0, 5));
    }

    setSuccess(true);
    setScannedQRCode(null);
    setSelectedItemId(null);
    setManualCode("");
  };

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(false), 2500);
    return () => window.clearTimeout(timer);
  }, [success]);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={onBack ?? (() => router.push("/scan"))}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground">
          Link Item with QR
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground"
          aria-label="Help"
        >
          <CircleHelp className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 pb-8">
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            QR code linked. Item is ready for sale.
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={() => setInputMode("scan")}
            className={cn(
              "rounded-full py-2.5 text-sm font-semibold transition-colors",
              inputMode === "scan"
                ? "bg-brand-purple text-white shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Scan QR
          </button>
          <button
            type="button"
            onClick={() => setInputMode("manual")}
            className={cn(
              "rounded-full py-2.5 text-sm font-semibold transition-colors",
              inputMode === "manual"
                ? "bg-brand-purple text-white shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Enter Manually
          </button>
        </div>

        {inputMode === "scan" ? (
          <div className="overflow-hidden rounded-2xl bg-brand-lavender/25 p-6">
            <div className="relative mx-auto aspect-[4/3] max-w-sm overflow-hidden rounded-xl bg-brand-lavender/20">
              {typeof window !== "undefined" ? (
                <QrScanner
                  onScan={(detectedCodes) => {
                    if (!detectedCodes?.length) return;
                    const raw =
                      typeof detectedCodes[0].rawValue === "string"
                        ? detectedCodes[0].rawValue
                        : String(detectedCodes[0].rawValue ?? "");
                    void resolveCode(raw);
                  }}
                  onError={() => setError("Camera access denied or unavailable")}
                  constraints={{ facingMode: "environment" }}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[70%] w-[70%] rounded-xl border-2 border-white/80" />
              </div>
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Scan QR code on your physical tag
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">Or enter code manually</p>
              <div className="flex gap-2">
                <input
                  value={manualCode}
                  onChange={(event) => {
                    setManualCode(event.target.value);
                    setError(null);
                  }}
                  placeholder="Enter QR code (e.g. BLOEM-1234)"
                  className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
                />
                <Button
                  type="button"
                  className="shrink-0 rounded-xl bg-brand-lavender px-5 text-brand-purple hover:bg-brand-lavender/90"
                  onClick={() => void resolveCode(manualCode)}
                >
                  Link
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Enter QR code manually</p>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(event) => {
                  setManualCode(event.target.value);
                  setError(null);
                }}
                placeholder="Enter QR code (e.g. BLOEM-1234)"
                className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
              <Button
                type="button"
                className="shrink-0 rounded-xl bg-brand-lavender px-5 text-brand-purple hover:bg-brand-lavender/90"
                onClick={() => void resolveCode(manualCode)}
              >
                Link
              </Button>
            </div>
          </div>
        )}

        {scannedQRCode && (
          <div className="rounded-xl border bg-card px-4 py-3 text-sm">
            <p className="font-medium">Scanned: {scannedQRCode.qrCode.code}</p>
            {!scannedQRCode.canLink && (
              <p className="mt-1 text-destructive">
                {scannedQRCode.reason ?? "This QR code cannot be linked"}
              </p>
            )}
            <button
              type="button"
              className="mt-2 text-sm font-medium text-brand-purple"
              onClick={() => {
                setScannedQRCode(null);
                setSelectedItemId(null);
              }}
            >
              Scan a different code
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-base font-bold">Select Item to Link</h2>
          {wardrobeItems.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No wardrobe items available to link.
              </p>
              <Button asChild variant="link" className="mt-2 text-brand-purple">
                <Link href="/wardrobe/upload">Add an item</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {wardrobeItems.map((item) => {
                const selected = selectedItemId === item.id;
                const disabled = !scannedQRCode?.canLink;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedItemId(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-brand-purple bg-brand-purple/5"
                          : "border-border hover:border-brand-purple/40",
                        disabled && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {item.thumbnail_url ? (
                          <Image
                            src={item.thumbnail_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <Package className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.size?.name ? `${item.size.name} · ` : ""}
                          {itemStatusLabel(item.status)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                          selected
                            ? "border-brand-purple bg-brand-purple text-white"
                            : "border-muted-foreground/30"
                        )}
                        aria-hidden
                      >
                        {selected ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {scannedQRCode?.canLink && wardrobeItems.length > 0 && (
            <Button
              type="button"
              className="h-12 w-full rounded-full bg-brand-purple hover:bg-brand-purple/90"
              disabled={!selectedItemId || linking}
              onClick={() => void handleLink()}
            >
              {linking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link to selected item"
              )}
            </Button>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Linked Items</h2>
            <Link href="/wardrobe" className="text-sm font-semibold text-brand-purple">
              View all
            </Link>
          </div>
          {linkedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No linked items yet.</p>
          ) : (
            <ul className="space-y-2">
              {linkedItems.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {entry.item?.thumbnail_url ? (
                      <Image
                        src={entry.item.thumbnail_url}
                        alt={entry.item.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <Package className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{entry.item?.title ?? "Item"}</p>
                    <p className="text-sm text-muted-foreground">QR: {entry.code}</p>
                  </div>
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}


