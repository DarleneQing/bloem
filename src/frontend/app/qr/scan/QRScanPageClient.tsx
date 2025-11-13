"use client";

import { useRouter } from "next/navigation";
import { QRScanner } from "@/components/qr-codes/QRScanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface QRScanPageClientProps {
  code?: string;
}

export function QRScanPageClient({ code }: QRScanPageClientProps) {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If code is provided in URL, fetch and display item
  useEffect(() => {
    if (code) {
      fetchItem(code);
    }
  }, [code]);

  const fetchItem = async (qrCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: qrCode }),
      });

      const data = await response.json();

      if (data.success) {
        setScanResult(data.data);
      } else {
        setError(data.error || "Failed to scan QR code");
      }
    } catch (err) {
      setError("Failed to scan QR code");
      console.error("Error scanning QR code:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (scannedCode: string) => {
    router.push(`/qr/scan?code=${encodeURIComponent(scannedCode)}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-6 md:py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (scanResult && scanResult.item) {
    const item = scanResult.item;
    return (
      <div className="container mx-auto max-w-4xl py-6 md:py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>Scanned QR Code: {code}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                {item.thumbnail_url && (
                  <Image
                    src={item.thumbnail_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{item.title}</h2>
                  {item.description && (
                    <p className="text-muted-foreground mt-2">{item.description}</p>
                  )}
                </div>
                {item.selling_price && (
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      CHF {item.selling_price.toFixed(2)}
                    </p>
                  </div>
                )}
                {item.owner && (
                  <div>
                    <p className="text-sm text-muted-foreground">Seller</p>
                    <p className="font-medium">
                      {item.owner.first_name} {item.owner.last_name}
                    </p>
                  </div>
                )}
                <div className="pt-4">
                  <Button asChild className="w-full">
                    <Link href={`/items/${item.id}`}>View Full Details</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (scanResult && !scanResult.item) {
    // QR code exists but not linked
    return (
      <div className="container mx-auto max-w-4xl py-6 md:py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">QR Code Not Linked</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This QR code has not been linked to an item yet.
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  {code}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setScanResult(null);
                  router.push("/qr/scan");
                }}
              >
                Scan Another Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl py-6 md:py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-red-100">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Error</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  router.push("/qr/scan");
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

