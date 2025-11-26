// QR Code Scanner Types

/**
 * QR scan result from scanner library
 */
export interface QRScanResult {
  text?: string;
  rawValue?: string;
  data?: string;
  getText?: () => string;
  [key: string]: unknown;
}

/**
 * Parsed QR code data
 */
export interface ParsedQRCode {
  code: string;
  isValid: boolean;
  error?: string;
}

/**
 * QR Scanner props
 */
export interface QRScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  className?: string;
}
