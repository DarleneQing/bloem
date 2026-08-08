import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminServer, mockFrom } = vi.hoisted(() => ({
  mockRequireAdminServer: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/auth/utils", () => ({
  requireAdminServer: () => mockRequireAdminServer(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
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
      if (table === "qr_codes") {
        return chainable({ data: [{ batch_id: BATCH.id, status: "UNUSED" }] });
      }
      throw new Error(`Unexpected table: ${table}`);
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
      if (table === "qr_codes") return chainable({ data: [] });
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await GET(
      request("http://localhost/api/admin/qr-batches?limit=9999")
    );
    const json = await res.json();

    expect(json.data.pagination.limit).toBe(100);
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
      if (table === "qr_codes") {
        return chainable({ data: [] });
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

  it("fetches QR code stats for all batches in a single query instead of one per batch", async () => {
    let qrBatchesCalls = 0;
    let qrCodesCalls = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "qr_batches") {
        qrBatchesCalls += 1;
        return qrBatchesCalls === 1
          ? chainable({ data: [BATCH, { ...BATCH, id: "batch-2" }], error: null })
          : chainable({ count: 2, error: null });
      }
      if (table === "qr_codes") {
        qrCodesCalls += 1;
        return chainable({
          data: [
            { batch_id: "batch-1", status: "UNUSED" },
            { batch_id: "batch-2", status: "SOLD" },
          ],
        });
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await GET(request("http://localhost/api/admin/qr-batches"));
    const json = await res.json();

    expect(qrCodesCalls).toBe(1);
    expect(json.data.batches[0].statistics.total).toBe(1);
    expect(json.data.batches[1].statistics.total).toBe(1);
    expect(json.data.batches[1].statistics.sold).toBe(1);
  });

  it("pages past PostgREST's 1000-row response cap when counting QR code stats", async () => {
    let qrBatchesCalls = 0;
    let qrCodesRangeCalls = 0;

    // A full first page (== the cap) must trigger a second .range() call;
    // a short first page would previously silently under-count.
    const page1 = Array.from({ length: 1000 }, () => ({
      batch_id: BATCH.id,
      status: "UNUSED",
    }));
    const page2 = Array.from({ length: 500 }, () => ({
      batch_id: BATCH.id,
      status: "SOLD",
    }));

    mockFrom.mockImplementation((table: string) => {
      if (table === "qr_batches") {
        qrBatchesCalls += 1;
        return qrBatchesCalls === 1
          ? chainable({ data: [BATCH], error: null })
          : chainable({ count: 1, error: null });
      }
      if (table === "qr_codes") {
        const obj: Record<string, unknown> = {
          select: vi.fn(() => obj),
          in: vi.fn(() => obj),
          range: vi.fn(() => {
            qrCodesRangeCalls += 1;
            const data = qrCodesRangeCalls === 1 ? page1 : page2;
            return { then: (resolve: (value: unknown) => unknown) => resolve({ data }) };
          }),
        };
        return obj;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const res = await GET(request("http://localhost/api/admin/qr-batches"));
    const json = await res.json();

    expect(qrCodesRangeCalls).toBe(2);
    expect(json.data.batches[0].statistics.total).toBe(1500);
    expect(json.data.batches[0].statistics.unused).toBe(1000);
    expect(json.data.batches[0].statistics.sold).toBe(500);
  });
});
