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

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
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
  for (const method of ["select", "order", "eq", "or", "gte", "in", "range"]) {
    obj[method] = vi.fn(() => obj);
  }
  return obj;
}

const USER = { id: "user-1", email: "u@example.com" };

function setupMocks() {
  let profilesCalls = 0;
  const profilesChains: ReturnType<typeof chainable>[] = [];

  mockFrom.mockImplementation((table: string) => {
    if (table === "profiles") {
      profilesCalls += 1;
      // Call order in route.ts: 1=page query, 2=count query, 3=activeUsers,
      // 4=totalUsers, 5=adminUsers, 6=verifiedSellers, 7=recentSignups.
      const result =
        profilesCalls === 1
          ? { data: [USER], error: null }
          : { count: 1, error: null };
      const chain = chainable(result);
      profilesChains.push(chain);
      return chain;
    }
    if (table === "items" || table === "transactions") {
      return chainable({ data: [] });
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { profilesChains };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminServer.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
});

describe("GET /api/admin/users", () => {
  it("defaults page/limit instead of producing NaN when params are garbage", async () => {
    setupMocks();

    const res = await GET(request("http://localhost/api/admin/users?page=abc&limit=abc"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.limit).toBe(50);
  });

  it("clamps an oversized limit to 100", async () => {
    setupMocks();

    const res = await GET(request("http://localhost/api/admin/users?limit=9999"));
    const json = await res.json();

    expect(json.data.pagination.limit).toBe(100);
  });

  it("applies the role filter to both the page query and the count query", async () => {
    const { profilesChains } = setupMocks();

    const res = await GET(request("http://localhost/api/admin/users?role=ADMIN"));
    expect(res.status).toBe(200);

    // chain[0] = page query, chain[1] = count query — both must see the filter,
    // otherwise pagination totals don't match the filtered list being returned.
    expect(profilesChains[0].eq).toHaveBeenCalledWith("role", "ADMIN");
    expect(profilesChains[1].eq).toHaveBeenCalledWith("role", "ADMIN");
  });
});
