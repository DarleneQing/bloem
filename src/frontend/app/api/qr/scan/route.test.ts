import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { POST } from "./route";

function buildSelectChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/qr/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/qr/scan", () => {
  it("returns 400 when code is missing", async () => {
    const res = await POST(request({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when code is not a string", async () => {
    const res = await POST(request({ code: 12345 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when code format is malformed (validateQRCodeFormat fails)", async () => {
    const res = await POST(request({ code: "BLOEM-TEST-001" })); // 3 digits not 5
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid qr code format/i);
  });

  it("returns 400 for lowercase prefix", async () => {
    const res = await POST(request({ code: "BLOEM-test-00001" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when QR code not found in DB", async () => {
    mockFrom.mockReturnValue(
      buildSelectChain({ data: null, error: { code: "PGRST116" } })
    );
    const res = await POST(request({ code: "BLOEM-TEST-00001" }));
    expect(res.status).toBe(404);
  });
});
