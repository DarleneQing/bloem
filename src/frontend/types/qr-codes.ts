// ============================================================================
// QR CODE TYPES
// ============================================================================

/**
 * QR Code Status Enum
 */
export type QRCodeStatus = "UNUSED" | "LINKED" | "SOLD" | "INVALID";

/**
 * QR Code Interface
 */
export interface QRCode {
  id: string;
  code: string; // Format: BLOEM-[PREFIX]-[NUMBER]
  status: QRCodeStatus;
  item_id: string | null;
  linked_at: string | null;
  batch_id: string;
  prefix: string;
  invalidated_at: string | null;
  invalidation_reason: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * QR Code with Linked Item
 */
export interface QRCodeWithItem extends QRCode {
  item: {
    id: string;
    title: string;
    description: string;
    selling_price: number | null;
    image_urls: string[];
    thumbnail_url: string;
    owner: {
      first_name: string;
      last_name: string;
    };
  } | null;
}

/**
 * QR Batch Interface
 */
export interface QRBatch {
  id: string;
  name: string | null;
  prefix: string;
  market_id: string; // Required - all batches must be associated with a market
  code_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Extended fields (from joins)
  market?: {
    id: string;
    name: string;
    status: string;
  } | null;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

/**
 * QR Batch Statistics
 */
export interface QRBatchStats {
  batch_id: string;
  total: number;
  unused: number;
  linked: number;
  sold: number;
  invalid: number;
  unused_percentage: number;
  linked_percentage: number;
  sold_percentage: number;
  invalid_percentage: number;
}

/**
 * Platform-wide QR Code Statistics
 */
export interface PlatformQRStats {
  total: number;
  unused: number;
  linked: number;
  sold: number;
  invalid: number;
  unused_percentage: number;
  linked_percentage: number;
  sold_percentage: number;
  invalid_percentage: number;
  total_batches: number;
}

/**
 * QR Batch Creation Input
 */
export interface QRBatchCreationInput {
  prefix: string;
  codeCount: number; // 1-500
  marketId: string; // Required - all batches must be associated with a market
  name?: string | null;
}

/**
 * QR Code Invalidation Input
 */
export interface QRCodeInvalidationInput {
  reason: string;
}

/**
 * QR Batch with Statistics
 */
export interface QRBatchWithStats extends QRBatch {
  statistics: QRBatchStats;
}

/**
 * QR Code Scanning Result
 */
export interface QRCodeScanResult {
  qrCode: QRCode;
  market: {
    id: string;
    name: string;
    status: string;
  } | null;
  item: {
    id: string;
    title: string;
    description: string | null;
    selling_price: number | null;
    image_urls: string[];
    thumbnail_url: string;
    owner: {
      id: string;
      first_name: string;
      last_name: string;
    };
  } | null;
  canLink: boolean;
  reason?: string;
}

/**
 * QR Code Linking Input
 */
export interface QRCodeLinkingInput {
  qrCodeId: string;
  itemId: string;
}

/**
 * QR Code Linking Result
 */
export interface QRCodeLinkingResult {
  qrCode: QRCode;
  item: {
    id: string;
    title: string;
    status: string;
    market_id: string; // Required - all batches must be associated with a market
  };
}

