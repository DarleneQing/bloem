import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminServer } = vi.hoisted(() => ({
  mockRequireAdminServer: vi.fn(),
}));

vi.mock("@/lib/auth/utils", () => ({
  requireAdminServer: () => mockRequireAdminServer(),
}));

import { PATCH } from "./route";

function request() {
  return new Request("http://localhost/api/admin/users/x/seller-status", {
    method: "PATCH",
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminServer.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
});

describe("PATCH /api/admin/users/[id]/seller-status (legacy 410 endpoint)", () => {
  it("returns 410 Gone for an authenticated admin (legacy IBAN endpoint disabled)", async () => {
    const res = await PATCH(request());
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/stripe connect/i);
  });

  it("returns 500 when admin gate throws", async () => {
    mockRequireAdminServer.mockRejectedValue(new Error("not admin"));
    const res = await PATCH(request());
    expect(res.status).toBe(500);
  });
});
