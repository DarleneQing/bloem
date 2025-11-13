import type {
  QRBatchStats,
  QRBatchWithStats,
  PlatformQRStats,
  QRCode,
} from "@/types/qr-codes";

/**
 * Get all QR batches with optional filters
 */
export async function getQRBatches(filters?: {
  page?: number;
  limit?: number;
  marketId?: string;
  prefix?: string;
}): Promise<{
  batches: QRBatchWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const params = new URLSearchParams();
  if (filters?.page) params.set("page", filters.page.toString());
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.marketId) params.set("marketId", filters.marketId);
  if (filters?.prefix) params.set("prefix", filters.prefix);

  const res = await fetch(`/api/admin/qr-batches?${params.toString()}`, {
    cache: "no-store",
  });
  const json = await res.json();

  if (!json?.success) {
    return {
      batches: [],
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 50,
        total: 0,
        totalPages: 0,
      },
    };
  }

  return json.data as {
    batches: QRBatchWithStats[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * Get QR batch by ID
 */
export async function getQRBatchById(id: string): Promise<QRBatchWithStats | null> {
  const batches = await getQRBatches({ limit: 1000 });
  return batches.batches.find((b) => b.id === id) || null;
}

/**
 * Get QR batch statistics
 */
export async function getQRBatchStats(batchId: string): Promise<QRBatchStats | null> {
  const batch = await getQRBatchById(batchId);
  return batch?.statistics || null;
}

/**
 * Get platform-wide QR code statistics
 */
export async function getPlatformQRStats(): Promise<PlatformQRStats | null> {
  // For now, aggregate from all batches
  // In the future, this could be optimized with a dedicated API endpoint
  const batches = await getQRBatches({ limit: 1000 });
  
  let total = 0;
  let unused = 0;
  let linked = 0;
  let sold = 0;
  let invalid = 0;

  batches.batches.forEach((batch) => {
    const stats = batch.statistics;
    total += stats.total;
    unused += stats.unused;
    linked += stats.linked;
    sold += stats.sold;
    invalid += stats.invalid;
  });

  return {
    total,
    unused,
    linked,
    sold,
    invalid,
    unused_percentage: total > 0 ? (unused / total) * 100 : 0,
    linked_percentage: total > 0 ? (linked / total) * 100 : 0,
    sold_percentage: total > 0 ? (sold / total) * 100 : 0,
    invalid_percentage: total > 0 ? (invalid / total) * 100 : 0,
    total_batches: batches.batches.length,
  };
}

/**
 * Get QR codes by batch ID
 */
export async function getQRCodesByBatch(_batchId: string): Promise<QRCode[]> {
  // This would need a dedicated API endpoint
  // For now, return empty array
  // TODO: Create GET /api/admin/qr-batches/[id]/codes endpoint
  return [];
}

