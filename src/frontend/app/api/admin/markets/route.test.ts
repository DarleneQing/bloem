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
  for (const method of ["select", "order", "eq", "or", "ilike", "in", "range"]) {
    obj[method] = vi.fn(() => obj);
  }
  return obj;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminServer.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
});

function setupEmptyMarkets() {
  let marketsCalls = 0;
  mockFrom.mockImplementation((table: string) => {
    if (table === "markets") {
      marketsCalls += 1;
      // 1st call = main list query, 2nd call = count query
      return marketsCalls === 1
        ? chainable({ data: [], error: null })
        : chainable({ count: 0, error: null });
    }
    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("GET /api/admin/markets", () => {
  it("defaults page/limit instead of producing NaN when params are garbage", async () => {
    setupEmptyMarkets();

    const res = await GET(request("http://localhost/api/admin/markets?page=abc&limit=abc"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.limit).toBe(20);
  });

  it("clamps an oversized limit to 100", async () => {
    setupEmptyMarkets();

    const res = await GET(request("http://localhost/api/admin/markets?limit=9999"));
    const json = await res.json();

    expect(json.data.pagination.limit).toBe(100);
  });
});
