import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockFrom = vi.fn();
const requireAdminServerMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/auth/utils", () => ({
  requireAdminServer: () => requireAdminServerMock(),
}));

function buildFetchChain(result: { data: unknown; error: unknown }) {
  // .select(…).eq(…).single() pattern.
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function buildUpdateChain(result: { data: unknown; error: unknown }) {
  // .update(…).eq(…).select(…).single() pattern.
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

const TARGET_ID = "22222222-2222-4222-8222-222222222222";
const ADMIN_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminServerMock.mockResolvedValue({ id: ADMIN_ID, role: "ADMIN" });
});

function makeRequest() {
  return new Request("http://localhost/api/admin/users/x/suspend", {
    method: "POST",
  }) as never;
}

describe("POST /api/admin/users/[id]/suspend", () => {
  it("rejects suspending your own account", async () => {
    const response = await POST(makeRequest(), {
      params: { id: ADMIN_ID },
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/own account/i);
  });

  it("returns 500 when admin gate throws", async () => {
    requireAdminServerMock.mockRejectedValue(new Error("not admin"));
    const response = await POST(makeRequest(), { params: { id: TARGET_ID } });
    // Route catches and returns 500 generic error.
    expect(response.status).toBe(500);
  });

  it("returns 404 when target user not found", async () => {
    mockFrom.mockReturnValue(
      buildFetchChain({ data: null, error: { message: "no rows" } })
    );
    const response = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(response.status).toBe(404);
  });

  it("refuses to suspend an ADMIN target", async () => {
    mockFrom.mockReturnValue(
      buildFetchChain({
        data: { id: TARGET_ID, role: "ADMIN", suspended_at: null },
        error: null,
      })
    );
    const response = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/admin/i);
  });

  it("suspends a non-admin USER when not currently suspended", async () => {
    let calls = 0;
    mockFrom.mockImplementation(() => {
      calls += 1;
      if (calls === 1) {
        return buildFetchChain({
          data: { id: TARGET_ID, role: "USER", suspended_at: null },
          error: null,
        });
      }
      return buildUpdateChain({
        data: { id: TARGET_ID, suspended_at: new Date().toISOString() },
        error: null,
      });
    });

    const response = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.suspended).toBe(true);
  });

  it("un-suspends a user who was previously suspended", async () => {
    let calls = 0;
    mockFrom.mockImplementation(() => {
      calls += 1;
      if (calls === 1) {
        return buildFetchChain({
          data: {
            id: TARGET_ID,
            role: "USER",
            suspended_at: "2026-05-19T00:00:00Z",
          },
          error: null,
        });
      }
      return buildUpdateChain({
        data: { id: TARGET_ID, suspended_at: null },
        error: null,
      });
    });

    const response = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.suspended).toBe(false);
  });

  it("returns 500 on DB update error", async () => {
    let calls = 0;
    mockFrom.mockImplementation(() => {
      calls += 1;
      if (calls === 1) {
        return buildFetchChain({
          data: { id: TARGET_ID, role: "USER", suspended_at: null },
          error: null,
        });
      }
      return buildUpdateChain({ data: null, error: { message: "constraint" } });
    });

    const response = await POST(makeRequest(), { params: { id: TARGET_ID } });
    expect(response.status).toBe(500);
  });
});
