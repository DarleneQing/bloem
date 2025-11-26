"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Camera, X } from "lucide-react";
import type { QRScanResult } from "@/types/qr-scanner";
import { logger } from "@/lib/logger";

// Dynamically import Scanner from @yudiel/react-qr-scanner
// Next.js dynamic() requires returning { default: Component }
const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => ({ default: mod.Scanner })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        Loading camera...
      </div>
    ),
  }
);

interface QRScannerProps {
  onScan: (code: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  showManualInput?: boolean;
}

export function QRScanner({
  onScan,
  onCancel,
  title = "Scan QR Code",
  description = "Point your camera at the QR code",
  showManualInput = true,
}: QRScannerProps) {
  const [manualInput, setManualInput] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(
    (data: QRScanResult | string) => {
      // Debug: log what we receive
      logger.debug("QR Scanner received data:", data, typeof data);
      
      // The library's onScan callback receives the decoded data directly
      // It could be a string or an object with text property
      let code: string = "";
      
      if (typeof data === "string") {
        code = data.trim();
      } else if (data?.text) {
        code = String(data.text).trim();
      } else if (data?.getText && typeof data.getText === "function") {
        try {
          code = String(data.getText()).trim();
        } catch (e) {
          logger.error("Error calling getText():", e);
        }
      } else if (data && typeof data === "object") {
        // Try to extract text from various possible properties
        const result = data as Record<string, unknown>;
        code = String(result.text || result.data || result.value || result.code || result.rawValue || JSON.stringify(data)).trim();
      } else {
        code = String(data).trim();
      }
      
      logger.debug("Extracted code:", code);
      
      if (code) {
        // Extract code from URL if it's a full URL
        // Handle both /qr/CODE and just the code itself
        let extractedCode = code;
        
        // Try to extract from URL pattern
        const urlMatch = code.match(/\/qr\/(BLOEM-[A-Z0-9_-]+-\d{5})/);
        if (urlMatch) {
          extractedCode = urlMatch[1];
        } else {
          // Try to extract just the BLOEM code from anywhere in the string
          const codeMatch = code.match(/(BLOEM-[A-Z0-9_-]+-\d{5})/);
          if (codeMatch) {
            extractedCode = codeMatch[1];
          }
        }
        
        logger.debug("Final extracted code:", extractedCode);
        
        // Validate format - BLOEM-PREFIX-00001 (5 digits at the end)
        const qrCodePattern = /^BLOEM-[A-Z0-9_-]+-\d{5}$/;
        if (qrCodePattern.test(extractedCode)) {
          setError(null);
          onScan(extractedCode);
        } else {
          logger.error("QR code validation failed. Pattern:", qrCodePattern, "Code:", extractedCode);
          setError(`Invalid QR code format. Expected: BLOEM-PREFIX-00001, got: ${extractedCode}`);
        }
      } else {
        setError("No QR code data received");
      }
    },
    [onScan]
  );

  const handleError = useCallback((error: Error | unknown) => {
    logger.error("QR scanner error:", error);
    setError("Camera access denied or unavailable");
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualInput.trim();
    
    // Extract code from URL if it's a full URL
    const urlMatch = code.match(/\/qr\/(BLOEM-[A-Z0-9_-]+-\d{5})/);
    const extractedCode = urlMatch ? urlMatch[1] : code;
    
    if (/^BLOEM-[A-Z0-9_-]+-\d{5}$/.test(extractedCode)) {
      setError(null);
      onScan(extractedCode);
    } else {
      setError("Invalid QR code format. Expected: BLOEM-PREFIX-00001");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!showManual ? (
          <div className="space-y-4">
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
              {typeof window !== "undefined" && (
                <QrScanner
                  onScan={(detectedCodes) => {
                    // Library returns array of detected barcodes
                    if (detectedCodes && detectedCodes.length > 0) {
                      const firstCode = detectedCodes[0];
                      // Extract the raw value as string from the detected barcode
                      const rawValue = typeof firstCode.rawValue === 'string' 
                        ? firstCode.rawValue 
                        : String(firstCode.rawValue || '');
                      handleScan(rawValue);
                    }
                  }}
                  onError={(err: Error | unknown) => {
                    handleError(err);
                  }}
                />
              )}
            </div>

            {showManualInput && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowManual(true)}
                className="w-full"
              >
                Enter QR Code Manually
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label htmlFor="qrCode" className="block text-sm font-medium mb-1">
                QR Code
              </label>
              <input
                id="qrCode"
                type="text"
                value={manualInput}
                onChange={(e) => {
                  setManualInput(e.target.value);
                  setError(null);
                }}
                placeholder="BLOEM-MARKET01-00001 or full URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Scan
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowManual(false);
                  setManualInput("");
                  setError(null);
                }}
              >
                Use Camera
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

