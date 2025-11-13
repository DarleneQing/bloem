import QRCode from "qrcode";

// ============================================================================
// QR CODE GENERATION UTILITIES
// ============================================================================

/**
 * Get the base URL for QR code URLs
 */
export function getQRCodeBaseURL(): string {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "https://app.bloem.com";
  return baseURL.replace(/\/$/, ""); // Remove trailing slash
}

/**
 * Format QR code string: BLOEM-[PREFIX]-[NUMBER]
 * @param prefix - The prefix for the QR code (e.g., "MARKET01")
 * @param number - The number (1-500)
 * @returns Formatted QR code string
 */
export function formatQRCode(prefix: string, number: number): string {
  const paddedNumber = number.toString().padStart(5, "0");
  return `BLOEM-${prefix}-${paddedNumber}`;
}

/**
 * Generate an array of QR code strings for a batch
 * @param prefix - The prefix for the QR codes
 * @param count - Number of codes to generate (1-500)
 * @returns Array of formatted QR code strings
 */
export function generateBatchCodes(prefix: string, count: number): string[] {
  const codes: string[] = [];
  for (let i = 1; i <= count; i++) {
    codes.push(formatQRCode(prefix, i));
  }
  return codes;
}

/**
 * Generate the full URL for a QR code
 * @param code - The QR code string (e.g., "BLOEM-MARKET01-00001")
 * @returns Full URL (e.g., "https://app.bloem.com/qr/BLOEM-MARKET01-00001")
 */
export function generateQRCodeURL(code: string): string {
  const baseURL = getQRCodeBaseURL();
  return `${baseURL}/qr/${code}`;
}

/**
 * Generate QR code image as data URL
 * @param code - The QR code string
 * @param url - The URL to encode in the QR code (defaults to generated URL)
 * @param options - QR code generation options
 * @returns Promise resolving to data URL string
 */
export async function generateQRCodeImage(
  code: string,
  url?: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> {
  const qrURL = url || generateQRCodeURL(code);
  
  const defaultOptions = {
    width: options?.width || 300,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || "#000000",
      light: options?.color?.light || "#FFFFFF",
    },
  };

  try {
    const dataURL = await QRCode.toDataURL(qrURL, defaultOptions);
    return dataURL;
  } catch (error) {
    console.error("Error generating QR code image:", error);
    throw new Error("Failed to generate QR code image");
  }
}

/**
 * Generate multiple QR code images for a batch
 * @param codes - Array of QR code strings
 * @param options - QR code generation options
 * @returns Promise resolving to array of objects with code and data URL
 */
export async function generateBatchQRCodeImages(
  codes: string[],
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<Array<{ code: string; qrDataUrl: string; url: string }>> {
  const results = await Promise.all(
    codes.map(async (code) => {
      const url = generateQRCodeURL(code);
      const qrDataUrl = await generateQRCodeImage(code, url, options);
      return { code, qrDataUrl, url };
    })
  );
  return results;
}

/**
 * Validate QR code format
 * @param code - The QR code string to validate
 * @returns True if valid, false otherwise
 */
export function validateQRCodeFormat(code: string): boolean {
  const pattern = /^BLOEM-[A-Z0-9_-]+-\d{5}$/;
  return pattern.test(code);
}

/**
 * Extract prefix from QR code
 * @param code - The QR code string
 * @returns The prefix or null if invalid
 */
export function extractPrefixFromCode(code: string): string | null {
  const match = code.match(/^BLOEM-([A-Z0-9_-]+)-\d{5}$/);
  return match ? match[1] : null;
}

/**
 * Extract number from QR code
 * @param code - The QR code string
 * @returns The number or null if invalid
 */
export function extractNumberFromCode(code: string): number | null {
  const match = code.match(/^BLOEM-[A-Z0-9_-]+-(\d{5})$/);
  return match ? parseInt(match[1], 10) : null;
}

