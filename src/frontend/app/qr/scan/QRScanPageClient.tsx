"use client";

import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/qr-codes/QRScanner";
import { useEffect } from "react";

interface QRScanPageClientProps {
  code?: string;
}

export function QRScanPageClient({ code }: QRScanPageClientProps) {
  const router = useRouter();

  // If code is provided in URL, redirect to /qr/[code] page which shows full details
  useEffect(() => {
    if (code) {
      router.push(`/qr/${encodeURIComponent(code)}`);
    }
  }, [code, router]);

  const handleScan = (scannedCode: string) => {
    // Redirect to /qr/[code] which shows full item details
    router.push(`/qr/${encodeURIComponent(scannedCode)}`);
  };


  // Default: Show scanner for buyers
  return (
    <div className="container mx-auto max-w-4xl py-6 md:py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-primary">Scan Item QR Code</h1>
        <p className="text-muted-foreground mt-2">
          Scan a QR code on an item to view its details
        </p>
      </div>

      <QRScanner
        onScan={handleScan}
        title="Scan Item QR Code"
        description="Point your camera at the QR code on the item"
        showManualInput={true}
      />
    </div>
  );
}

