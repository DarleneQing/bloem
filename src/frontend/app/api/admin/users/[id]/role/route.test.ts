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

import { PATCH } from "./route";

const TARGET_ID = "22222222-2222-4222-8222-222222222222";

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
  return new Request("http://localhost/api/admin/users/x/role", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminServer.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
});

describe("PATCH /api/admin/users/[id]/role", () => {
  it("returns 500 when admin gate throws (caught)", async () => {
    mockRequireAdminServer.mockRejectedValue(new Error("not admin"));
    const res = await PATCH(request({ role: "ADMIN" }), {
      params: { id: TARGET_ID },
    });
    expect(res.status).toBe(500);
  });

  it.each([
    [{}, "missing role"],
    [{ role: "" }, "empty role"],
    [{ role: "SUPERUSER" }, "unknown role"],
  ])("returns 400 for %s", async (body) => {
    const res = await PATCH(request(body), { params: { id: TARGET_ID } });
    expect(res.status).toBe(400);
  });

  it("returns 200 with success message on role update to ADMIN", async () => {
    mockFrom.mockReturnValue(
      buildUpdateChain({
        data: { id: TARGET_ID, role: "ADMIN" },
        error: null,
      })
    );
    const res = await PATCH(request({ role: "ADMIN" }), {
      params: { id: TARGET_ID },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/ADMIN/);
  });

  it("returns 200 on role downgrade to USER", async () => {
    mockFrom.mockReturnValue(
      buildUpdateChain({
        data: { id: TARGET_ID, role: "USER" },
        error: null,
      })
    );
    const res = await PATCH(request({ role: "USER" }), {
      params: { id: TARGET_ID },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/USER/);
  });

  it("returns 500 on DB error", async () => {
    mockFrom.mockReturnValue(
      buildUpdateChain({ data: null, error: { message: "fk violation" } })
    );
    const res = await PATCH(request({ role: "ADMIN" }), {
      params: { id: TARGET_ID },
    });
    expect(res.status).toBe(500);
  });
});
