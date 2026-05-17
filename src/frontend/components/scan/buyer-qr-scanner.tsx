"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCartItemCount } from "@/features/carts/queries";
import { parseScannedQRCode } from "@/lib/qr/parse-scanned-code";
import {
  addRecentScan,
  getRecentScans,
  type RecentScanEntry,
} from "@/lib/scan/recent-scans";
import { cn } from "@/lib/utils";
import { Flashlight, ShoppingCart, X } from "lucide-react";

const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => ({ default: mod.Scanner })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        Loading camera...
      </div>
    ),
  }
);

interface BuyerQrScannerProps {
  initialCode?: string;
}

export function BuyerQrScanner({ initialCode }: BuyerQrScannerProps) {
  const router = useRouter();
  const [recentScans, setRecentScans] = useState<RecentScanEntry[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    setRecentScans(getRecentScans());
  }, []);

  const handleResolvedCode = useCallback(
    async (code: string) => {
      setError(null);

      try {
        const response = await fetch("/api/qr/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await response.json();

        if (data.success && data.data?.item) {
          const item = data.data.item;
          setRecentScans(
            addRecentScan({
              code,
              title: item.title,
              thumbnailUrl: item.thumbnail_url ?? null,
            })
          );
        } else if (data.success) {
          setRecentScans(
            addRecentScan({
              code,
              title: code,
              thumbnailUrl: null,
            })
          );
        }
      } catch {
        setRecentScans(
          addRecentScan({
            code,
            title: code,
            thumbnailUrl: null,
          })
        );
      }

      router.push(`/qr/${encodeURIComponent(code)}`);
    },
    [router]
  );

  useEffect(() => {
    if (!initialCode) return;
    void handleResolvedCode(initialCode);
  }, [initialCode, handleResolvedCode]);

  useEffect(() => {
    getCartItemCount()
      .then(setCartCount)
      .catch(() => setCartCount(0));
  }, []);

  const processRawScan = useCallback(
    (raw: string) => {
      const code = parseScannedQRCode(raw);
      if (!code) {
        setError("Invalid QR code format. Expected: BLOEM-PREFIX-00001");
        return;
      }
      void handleResolvedCode(code);
    },
    [handleResolvedCode]
  );

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    processRawScan(manualCode);
  };

  const previewScans = recentScans.slice(0, 4);

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-black md:h-[min(720px,calc(100dvh-8rem))] md:rounded-2xl">
      <div className="relative min-h-0 flex-1">
        {typeof window !== "undefined" && (
          <QrScanner
            onScan={(detectedCodes) => {
              if (!detectedCodes?.length) return;
              const raw =
                typeof detectedCodes[0].rawValue === "string"
                  ? detectedCodes[0].rawValue
                  : String(detectedCodes[0].rawValue ?? "");
              processRawScan(raw);
            }}
            onError={() => setError("Camera access denied or unavailable")}
            constraints={{ facingMode: "environment" }}
            formats={["qr_code"]}
            components={{ finder: false }}
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-black/20" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="pointer-events-auto h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
            onClick={() => router.push("/home")}
            aria-label="Close scanner"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="pointer-events-auto h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
            onClick={() => setTorchOn((current) => !current)}
            aria-label={torchOn ? "Turn off flash" : "Turn on flash"}
          >
            <Flashlight className={cn("h-5 w-5", torchOn && "text-brand-accent")} />
          </Button>
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10">
          <div className="aspect-square w-[min(72vw,280px)] rounded-2xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          <p className="mt-6 text-center text-sm font-medium text-white drop-shadow">
            Align QR code within the frame
          </p>
        </div>

        <Link
          href="/checkout"
          className="absolute bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple text-white shadow-lg"
          aria-label={`Checkout${cartCount > 0 ? `, ${cartCount} items` : ""}`}
        >
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-brand-purple">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </Link>
      </div>

      <section
        aria-label="Recent scans"
        className="z-20 min-h-[10.25rem] shrink-0 rounded-t-[2.75rem] bg-white px-5 pb-5 pt-6 shadow-[0_-12px_40px_rgba(0,0,0,0.15)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">Recent Scans</h2>
          {recentScans.length > 0 && (
            <button
              type="button"
              onClick={() => setSeeAllOpen(true)}
              className="text-sm font-semibold text-brand-purple"
            >
              See all
            </button>
          )}
        </div>

        {previewScans.length > 0 ? (
          <div className="mb-4 flex gap-3 overflow-x-auto pb-1">
            {previewScans.map((scan) => (
              <button
                key={scan.code}
                type="button"
                onClick={() => router.push(`/qr/${encodeURIComponent(scan.code)}`)}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100"
              >
                {scan.thumbnailUrl ? (
                  <Image
                    src={scan.thumbnailUrl}
                    alt={scan.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center px-1 text-[9px] font-medium text-neutral-500">
                    {scan.code.slice(-8)}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-4 flex min-h-16 items-center">
            <p className="text-sm text-neutral-500">
              Scanned items will appear here for quick access.
            </p>
          </div>
        )}

        {error && (
          <p className="mb-3 text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-full border-brand-purple bg-white text-brand-purple hover:bg-brand-purple/5"
          onClick={() => {
            setError(null);
            setManualOpen(true);
          }}
        >
          Enter Code Manually
        </Button>
      </section>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter QR code</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <input
              value={manualCode}
              onChange={(event) => {
                setManualCode(event.target.value);
                setError(null);
              }}
              placeholder="BLOEM-MARKET01-00001"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
              autoFocus
            />
            <Button type="submit" className="w-full bg-brand-purple hover:bg-brand-purple/90">
              View item
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={seeAllOpen} onOpenChange={setSeeAllOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recent scans</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {recentScans.map((scan) => (
              <button
                key={scan.code}
                type="button"
                onClick={() => {
                  setSeeAllOpen(false);
                  router.push(`/qr/${encodeURIComponent(scan.code)}`);
                }}
                className="flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted/50"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {scan.thumbnailUrl ? (
                    <Image
                      src={scan.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{scan.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{scan.code}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
