"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QRScanner } from "./QRScanner";
import { getWardrobeItemsForLinking } from "@/features/qr-codes/queries";
import { linkQRCodeToItem } from "@/features/qr-codes/actions";
import { CheckCircle, AlertCircle, Package, Loader2 } from "lucide-react";
import Image from "next/image";
import type { QRCodeScanResult } from "@/types/qr-codes";

interface QRCodeLinkingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedItemId?: string;
}

export function QRCodeLinkingForm({
  onSuccess,
  onCancel,
  preselectedItemId,
}: QRCodeLinkingFormProps) {
  const [scannedQRCode, setScannedQRCode] = useState<QRCodeScanResult | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load wardrobe items when QR code is scanned
  useEffect(() => {
    if (scannedQRCode && scannedQRCode.canLink) {
      loadItems();
    }
  }, [scannedQRCode]);

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const wardrobeItems = await getWardrobeItemsForLinking();
      setItems(wardrobeItems);
    } catch (err) {
      setError("Failed to load wardrobe items");
      console.error("Error loading items:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (!preselectedItemId) {
      return;
    }

    if (!scannedQRCode || !scannedQRCode.canLink) {
      return;
    }

    if (items.length === 0) {
      return;
    }

    const exists = items.some((wardrobeItem) => wardrobeItem.id === preselectedItemId);
    if (exists) {
      setSelectedItemId((current) => current || preselectedItemId);
    }
  }, [items, preselectedItemId, scannedQRCode]);

  const handleScan = async (code: string) => {
    setError(null);
    setSuccess(false);
    setSelectedItemId(null);

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
        canLink: data.data.qrCode.status === "UNUSED" && !data.data.qrCode.invalidated_at,
        reason: data.data.qrCode.status !== "UNUSED" 
          ? `QR code is already ${data.data.qrCode.status.toLowerCase()}`
          : data.data.qrCode.invalidated_at 
          ? "QR code has been invalidated"
          : undefined,
      };

      setScannedQRCode(scanResult);
    } catch (err) {
      setError("Failed to scan QR code");
      console.error("Error scanning QR code:", err);
    }
  };

  const handleLink = async () => {
    if (!scannedQRCode || !selectedItemId) {
      setError("Please select an item");
      return;
    }

    setLinking(true);
    setError(null);

    try {
      const result = await linkQRCodeToItem({
        qrCodeId: scannedQRCode.qrCode.id,
        itemId: selectedItemId,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      }
    } catch (err) {
      setError("Failed to link QR code");
      console.error("Error linking QR code:", err);
    } finally {
      setLinking(false);
    }
  };

  const handleReset = () => {
    setScannedQRCode(null);
    setSelectedItemId(null);
    setItems([]);
    setError(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">QR Code Linked Successfully!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The item has been moved to RACK status and is ready for sale.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scannedQRCode) {
    return (
      <QRScanner
        onScan={handleScan}
        onCancel={onCancel}
        title="Scan QR Code to Link"
        description="Scan the QR code from your printed label"
        showManualInput={true}
      />
    );
  }

  if (!scannedQRCode.canLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Cannot Link QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              {scannedQRCode.reason || "This QR code cannot be linked"}
            </p>
            {scannedQRCode.qrCode.status === "LINKED" && scannedQRCode.item && (
              <p className="text-sm text-red-800 mt-2">
                This QR code is already linked to: {scannedQRCode.item.title}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Scan Another Code
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scanned QR Code Info */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Scanned</CardTitle>
          <CardDescription>
            Code: {scannedQRCode.qrCode.code}
            {scannedQRCode.market && ` • Market: ${scannedQRCode.market.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleReset} size="sm">
            Scan Different Code
          </Button>
        </CardContent>
      </Card>

      {/* Item Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Item to Link</CardTitle>
          <CardDescription>
            Choose an item from your wardrobe to link to this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingItems ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items in wardrobe to link</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedItemId === item.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="item"
                      value={item.id}
                      checked={selectedItemId === item.id}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1 flex gap-4">
                      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.thumbnail_url ? (
                          <Image
                            src={item.thumbnail_url}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {item.brand && (
                            <span className="text-xs text-muted-foreground">
                              {item.brand.name}
                            </span>
                          )}
                          {item.size && (
                            <span className="text-xs text-muted-foreground">
                              • {item.size.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel} disabled={linking}>
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleLink}
                  disabled={!selectedItemId || linking}
                  className="flex-1"
                >
                  {linking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Link to Selected Item
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

