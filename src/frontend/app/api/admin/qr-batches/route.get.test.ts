import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminServer, mockFrom, mockRpc } = vi.hoisted(() => ({
  mockRequireAdminServer: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/lib/auth/utils", () => ({
  requireAdminServer: () => mockRequireAdminServer(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom, rpc: mockRpc })),
}));

import { GET } from "./route";

function request(url: string) {
  return new Request(url) as never;
}

/** A thenable that also chains every Postgrest filter method back to itself. */
function chainable(result: { data?: unknown; error?: unknown; count?: unknown }) {
  const obj: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  };
  for (const method of ["select", "order", "eq", "ilike", "in", "range"]) {
    obj[method] = vi.fn(() => obj);
  }
  return obj;
}

const BATCH = {
  id: "batch-1",
  name: "Batch 1",
  prefix: "AAA",
  market_id: "market-1",
  code_count: 2,
  created_by: "admin-1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminServer.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
  mockRpc.mockResolvedValue({ data: [], error: null });
});

describe("GET /api/admin/qr-batches", () => {
  it("defaults page/limit instead of producing NaN when params are garbage", async () => {
    let qrBatchesCalls = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "qr_batches") {
        qrBatchesCalls += 1;
        return qrBatchesCalls === 1
          ? chainable({ data: [BATCH], error: null })
          : chainable({ count: 1, error: null });
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    mockRpc.mockResolvedValue({
      data: [{ batch_id: BATCH.id, status: "UNUSED", cnt: 1 }],
      error: null,
    });

    const res = await GET(
      request("http://localhost/api/admin/qr-batches?page=abc&limit=abc")
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.limit).toBe(50);
  });

  it("clamps an oversized limit to 100", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "qr_batches") return chainable({ data: [], error: null, count: 0 });
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await GET(
      request("http://localhost/api/admin/qr-batches?limit=9999")
    );
    const json = await res.json();

    expect(json.data.pagination.limit).toBe(100);
    // No batches on the page — the stats RPC must not be called at all.
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("applies the marketId filter to both the list query and the count query", async () => {
    const calls: { table: string; call: number }[] = [];
    let qrBatchesCalls = 0;
    const chains: ReturnType<typeof chainable>[] = [];

    mockFrom.mockImplementation((table: string) => {
      calls.push({ table, call: calls.length });
      if (table === "qr_batches") {
        qrBatchesCalls += 1;
        const result = qrBatchesCalls === 1
          ? chainable({ data: [BATCH], error: null })
          : chainable({ count: 1, error: null });
        chains.push(result);
        return result;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await GET(
      request("http://localhost/api/admin/qr-batches?marketId=market-1")
    );
    expect(res.status).toBe(200);

    // Both the list query (chains[0]) and the count query (chains[1]) must
    // have been filtered by market_id — this was previously only applied to
    // the list query, making pagination totals wrong for filtered views.
    expect(chains[0].eq).toHaveBeenCalledWith("market_id", "market-1");
    expect(chains[1].eq).toHaveBeenCalledWith("market_id", "market-1");
  });

  it("aggregates stats for all batches via a single GROUP BY RPC", async () => {
    let qrBatchesCalls = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "qr_batches") {
        qrBatchesCalls += 1;
        return qrBatchesCalls === 1
          ? chainable({ data: [BATCH, { ...BATCH, id: "batch-2" }], error: null })
          : chainable({ count: 2, error: null });
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    mockRpc.mockResolvedValue({
      data: [
        { batch_id: "batch-1", status: "UNUSED", cnt: 1000 },
        { batch_id: "batch-1", status: "SOLD", cnt: 500 },
        { batch_id: "batch-2", status: "SOLD", cnt: 1 },
      ],
      error: null,
    });

    const res = await GET(request("http://localhost/api/admin/qr-batches"));
    const json = await res.json();

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith("qr_batch_status_counts", {
      batch_ids: ["batch-1", "batch-2"],
    });
    expect(json.data.batches[0].statistics.total).toBe(1500);
    expect(json.data.batches[0].statistics.unused).toBe(1000);
    expect(json.data.batches[0].statistics.sold).toBe(500);
    expect(json.data.batches[1].statistics.total).toBe(1);
    expect(json.data.batches[1].statistics.sold).toBe(1);
  });

  it("reports zero counts for a batch absent from the RPC result", async () => {
    let qrBatchesCalls = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "qr_batches") {
        qrBatchesCalls += 1;
        return qrBatchesCalls === 1
          ? chainable({ data: [BATCH, { ...BATCH, id: "batch-empty" }], error: null })
          : chainable({ count: 2, error: null });
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    mockRpc.mockResolvedValue({
      data: [{ batch_id: "batch-1", status: "LINKED", cnt: 3 }],
      error: null,
    });

    const res = await GET(request("http://localhost/api/admin/qr-batches"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.batches[1].statistics).toEqual({
      total: 0,
      unused: 0,
      linked: 0,
      sold: 0,
      invalid: 0,
      unused_percentage: 0,
      linked_percentage: 0,
      sold_percentage: 0,
      invalid_percentage: 0,
    });
  });
});
