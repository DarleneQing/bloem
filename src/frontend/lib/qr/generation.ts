import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// QR CODE GENERATION UTILITIES
// ============================================================================

/**
 * Generate QR code data URL from text
 */
export async function generateQRCodeDataURL(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions: QRCodeOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
    ...options,
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code SVG from text
 */
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const defaultOptions: QRCodeOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
    ...options,
  };

  try {
    return await QRCode.toString(text, { type: "svg", ...defaultOptions });
  } catch (error) {
    console.error("Error generating QR code SVG:", error);
    throw new Error("Failed to generate QR code SVG");
  }
}

/**
 * Generate QR code canvas element
 */
export async function generateQRCodeCanvas(
  text: string,
  canvas: HTMLCanvasElement,
  options: QRCodeOptions = {}
): Promise<void> {
  const defaultOptions: QRCodeOptions = {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
    ...options,
  };

  try {
    await QRCode.toCanvas(canvas, text, defaultOptions);
  } catch (error) {
    console.error("Error generating QR code canvas:", error);
    throw new Error("Failed to generate QR code canvas");
  }
}

// ============================================================================
// QR CODE BATCH GENERATION
// ============================================================================

/**
 * Generate multiple QR codes for a batch
 */
export async function generateQRCodeBatch(
  codes: string[],
  options: QRCodeOptions = {}
): Promise<QRCodeBatchResult[]> {
  const results: QRCodeBatchResult[] = [];
  
  for (const code of codes) {
    try {
      const dataURL = await generateQRCodeDataURL(code, options);
      results.push({
        code,
        dataURL,
        success: true,
      });
    } catch (error) {
      results.push({
        code,
        dataURL: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  
  return results;
}

/**
 * Generate QR codes for market items
 */
export async function generateMarketQRCodes(
  marketId: string,
  itemCount: number,
  options: QRCodeOptions = {}
): Promise<QRCodeBatchResult[]> {
  const codes: string[] = [];
  
  for (let i = 0; i < itemCount; i++) {
    const code = generateMarketQRCodeString(marketId, i + 1);
    codes.push(code);
  }
  
  return generateQRCodeBatch(codes, options);
}

// ============================================================================
// QR CODE STRING GENERATION
// ============================================================================

/**
 * Generate QR code string for market item
 */
export function generateMarketQRCodeString(marketId: string, itemNumber: number): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `BLOEM:${marketId}:${itemNumber}:${timestamp}:${randomSuffix}`;
}

/**
 * Generate QR code string for item linking
 */
export function generateItemQRCodeString(itemId: string, marketId: string): string {
  return `BLOEM:ITEM:${itemId}:MARKET:${marketId}`;
}

/**
 * Generate QR code string for transaction
 */
export function generateTransactionQRCodeString(transactionId: string): string {
  return `BLOEM:TX:${transactionId}`;
}

/**
 * Generate QR code string for user profile
 */
export function generateUserQRCodeString(userId: string): string {
  return `BLOEM:USER:${userId}`;
}

// ============================================================================
// QR CODE PARSING AND VALIDATION
// ============================================================================

/**
 * Parse QR code string and extract components
 */
export function parseQRCodeString(qrString: string): QRCodeParsed | null {
  const parts = qrString.split(":");
  
  if (parts.length < 2 || parts[0] !== "BLOEM") {
    return null;
  }
  
  const type = parts[1];
  
  switch (type) {
    case "ITEM":
      if (parts.length >= 5) {
        return {
          type: "ITEM",
          itemId: parts[2],
          marketId: parts[4],
        };
      }
      break;
      
    case "TX":
      if (parts.length >= 3) {
        return {
          type: "TRANSACTION",
          transactionId: parts[2],
        };
      }
      break;
      
    case "USER":
      if (parts.length >= 3) {
        return {
          type: "USER",
          userId: parts[2],
        };
      }
      break;
      
    default:
      // Market QR code format: BLOEM:marketId:itemNumber:timestamp:randomSuffix
      if (parts.length >= 5) {
        return {
          type: "MARKET",
          marketId: parts[1],
          itemNumber: parseInt(parts[2]),
          timestamp: parseInt(parts[3]),
          randomSuffix: parts[4],
        };
      }
      break;
  }
  
  return null;
}

/**
 * Validate QR code string format
 */
export function validateQRCodeString(qrString: string): boolean {
  const parsed = parseQRCodeString(qrString);
  return parsed !== null;
}

/**
 * Check if QR code is expired (older than 24 hours)
 */
export function isQRCodeExpired(qrString: string): boolean {
  const parsed = parseQRCodeString(qrString);
  
  if (!parsed || parsed.type !== "MARKET" || !parsed.timestamp) {
    return false;
  }
  
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return (now - parsed.timestamp) > twentyFourHours;
}

// ============================================================================
// QR CODE DATABASE OPERATIONS
// ============================================================================

/**
 * Create QR code batch in database
 */
export async function createQRCodeBatch(
  marketId: string,
  itemCount: number,
  batchName?: string
): Promise<QRCodeBatch> {
  const supabase = createClient();
  
  const batch = {
    market_id: marketId,
    batch_name: batchName || `Batch ${new Date().toISOString()}`,
    item_count: itemCount,
    created_at: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from("qr_batches")
    .insert(batch)
    .select()
    .single();
  
  if (error) {
    console.error("Error creating QR code batch:", error);
    throw new Error("Failed to create QR code batch");
  }
  
  return data;
}

/**
 * Generate QR codes for batch and save to database
 */
export async function generateAndSaveQRCodeBatch(
  marketId: string,
  itemCount: number,
  batchName?: string,
  options: QRCodeOptions = {}
): Promise<QRCodeBatchWithCodes> {
  // Create batch
  const batch = await createQRCodeBatch(marketId, itemCount, batchName);
  
  // Generate QR codes
  const qrCodes: QRCodeCreate[] = [];
  
  for (let i = 0; i < itemCount; i++) {
    const code = generateMarketQRCodeString(marketId, i + 1);
    const dataURL = await generateQRCodeDataURL(code, options);
    
    const qrCode = {
      batch_id: batch.id,
      code,
      qr_data_url: dataURL,
      item_number: i + 1,
      created_at: new Date().toISOString(),
    };
    
    qrCodes.push(qrCode);
  }
  
  // Save QR codes to database
  const supabase = createClient();
  const { data, error } = await supabase
    .from("qr_codes")
    .insert(qrCodes)
    .select();
  
  if (error) {
    console.error("Error saving QR codes:", error);
    throw new Error("Failed to save QR codes");
  }
  
  return {
    ...batch,
    qr_codes: data,
  };
}

/**
 * Get QR codes by batch ID
 */
export async function getQRCodesByBatch(batchId: string): Promise<QRCodeRecord[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("batch_id", batchId)
    .order("item_number", { ascending: true });
  
  if (error) {
    console.error("Error getting QR codes by batch:", error);
    return [];
  }
  
  return data || [];
}

/**
 * Link QR code to item
 */
export async function linkQRCodeToItem(
  qrCodeId: string,
  itemId: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("qr_codes")
    .update({
      item_id: itemId,
      linked_at: new Date().toISOString(),
    })
    .eq("id", qrCodeId);
  
  if (error) {
    console.error("Error linking QR code to item:", error);
    return false;
  }
  
  return true;
}

/**
 * Unlink QR code from item
 */
export async function unlinkQRCodeFromItem(qrCodeId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("qr_codes")
    .update({
      item_id: null,
      linked_at: null,
    })
    .eq("id", qrCodeId);
  
  if (error) {
    console.error("Error unlinking QR code from item:", error);
    return false;
  }
  
  return true;
}

// ============================================================================
// QR CODE DOWNLOAD UTILITIES
// ============================================================================

/**
 * Download QR code as image
 */
export function downloadQRCodeAsImage(
  dataURL: string,
  filename: string = "qrcode.png"
): void {
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download QR code batch as ZIP
 */
export async function downloadQRCodeBatchAsZIP(
  qrCodes: QRCodeRecord[],
  batchName: string
): Promise<void> {
  // This would require a ZIP library like JSZip
  // For now, we'll download individual files
  for (let i = 0; i < qrCodes.length; i++) {
    const qrCode = qrCodes[i];
    const filename = `${batchName}_${qrCode.item_number}.png`;
    downloadQRCodeAsImage(qrCode.qr_data_url, filename);
    
    // Add delay between downloads to avoid browser blocking
    if (i < qrCodes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// ============================================================================
// QR CODE PRINTING UTILITIES
// ============================================================================

/**
 * Generate printable QR code sheet
 */
export function generatePrintableQRSheet(
  qrCodes: QRCodeRecord[],
  options: PrintOptions = {}
): string {
  const defaultOptions: PrintOptions = {
    codesPerRow: 4,
    codesPerPage: 16,
    showItemNumbers: true,
    showBatchInfo: true,
  };
  
  const { codesPerRow, codesPerPage, showItemNumbers, showBatchInfo: _showBatchInfo } = {
    ...defaultOptions,
    ...options,
  };
  
  // This would generate HTML for printing
  // For now, return a simple HTML structure
  let html = `
    <div style="page-break-after: always;">
      <h2>QR Code Batch</h2>
      <div style="display: grid; grid-template-columns: repeat(${codesPerRow}, 1fr); gap: 20px;">
  `;
  
  qrCodes.slice(0, codesPerPage).forEach((qrCode, _index) => {
    html += `
      <div style="text-align: center; border: 1px solid #ccc; padding: 10px;">
        <img src="${qrCode.qr_data_url}" style="width: 100px; height: 100px;" />
        ${showItemNumbers ? `<p>Item #${qrCode.item_number}</p>` : ""}
        <p style="font-size: 10px; word-break: break-all;">${qrCode.code}</p>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}

// ============================================================================
// TYPES
// ============================================================================

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export interface QRCodeBatchResult {
  code: string;
  dataURL: string | null;
  success: boolean;
  error?: string;
}

export interface QRCodeParsed {
  type: "ITEM" | "TRANSACTION" | "USER" | "MARKET";
  itemId?: string;
  marketId?: string;
  transactionId?: string;
  userId?: string;
  itemNumber?: number;
  timestamp?: number;
  randomSuffix?: string;
}

export interface QRCodeBatch {
  id: string;
  market_id: string;
  batch_name: string;
  item_count: number;
  created_at: string;
}

export interface QRCodeRecord {
  id: string;
  batch_id: string;
  code: string;
  qr_data_url: string;
  item_number: number;
  item_id?: string;
  linked_at?: string;
  created_at: string;
}

export interface QRCodeCreate {
  batch_id: string;
  code: string;
  qr_data_url: string;
  item_number: number;
  created_at: string;
}

export interface QRCodeBatchWithCodes extends QRCodeBatch {
  qr_codes: QRCodeRecord[];
}

export interface PrintOptions {
  codesPerRow?: number;
  codesPerPage?: number;
  showItemNumbers?: boolean;
  showBatchInfo?: boolean;
}
