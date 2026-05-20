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

const QR_UUID = "11111111-1111-4111-8111-111111111111";

function buildSelectChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function buildUpdateChain(result: { data: unknown; error: unknown }) {
  return {
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/admin/qr-codes/x/invalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminServer.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
});

describe("POST /api/admin/qr-codes/[id]/invalidate", () => {
  it("returns 500 when admin gate throws", async () => {
    mockRequireAdminServer.mockRejectedValue(new Error("not admin"));
    const res = await POST(request({ reason: "Lost" }), {
      params: { id: QR_UUID },
    });
    expect(res.status).toBe(500);
  });

  it("returns 400 for invalid UUID format", async () => {
    const res = await POST(request({ reason: "Lost" }), {
      params: { id: "not-a-uuid" },
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid/i);
  });

  it("returns 400 when reason is missing/empty (Zod validation)", async () => {
    const res = await POST(request({}), { params: { id: QR_UUID } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.details).toBeTruthy();
  });

  it("returns 404 when QR code does not exist", async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return buildSelectChain({ data: null, error: { code: "PGRST116" } });
      }
      return buildUpdateChain({ data: null, error: null });
    });
    const res = await POST(request({ reason: "Lost" }), {
      params: { id: QR_UUID },
    });
    expect(res.status).toBe(404);
  });
});
