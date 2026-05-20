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

import { POST } from "./route";

const MARKET_ID = "11111111-1111-4111-8111-111111111111";

function buildSelectSingleChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
  return chain as never;
}

function request(body: unknown) {
  return new Request("http://localhost/api/admin/qr-batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminServer.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
});

describe("POST /api/admin/qr-batches", () => {
  it("returns 500 when admin gate throws", async () => {
    mockRequireAdminServer.mockRejectedValue(new Error("not admin"));
    const res = await POST(
      request({ prefix: "TEST", codeCount: 10, marketId: MARKET_ID })
    );
    expect(res.status).toBe(500);
  });

  it("returns 400 for missing fields", async () => {
    const res = await POST(request({ prefix: "TEST" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for lowercase prefix (regex fails)", async () => {
    const res = await POST(
      request({ prefix: "test", codeCount: 10, marketId: MARKET_ID })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for codeCount > 500", async () => {
    const res = await POST(
      request({ prefix: "TEST", codeCount: 501, marketId: MARKET_ID })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when market does not exist", async () => {
    mockFrom.mockReturnValue(
      buildSelectSingleChain({ data: null, error: { message: "no rows" } })
    );
    const res = await POST(
      request({ prefix: "TEST", codeCount: 10, marketId: MARKET_ID })
    );
    expect(res.status).toBe(404);
  });
});
