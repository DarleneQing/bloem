import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
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
  for (const method of ["select", "order", "eq", "or", "single", "range"]) {
    obj[method] = vi.fn(() => obj);
  }
  return obj;
}

const ADMIN_PROFILE = { role: "ADMIN" };

function setupMocks() {
  let itemsCalls = 0;
  const itemsChains: ReturnType<typeof chainable>[] = [];

  mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null });
  mockFrom.mockImplementation((table: string) => {
    if (table === "profiles") {
      return chainable({ data: ADMIN_PROFILE, error: null });
    }
    if (table === "items") {
      itemsCalls += 1;
      // Call order in route.ts: 1=page query, 2=count query, 3=stats query.
      const result =
        itemsCalls === 1
          ? { data: [], error: null }
          : itemsCalls === 2
            ? { count: 0, error: null }
            : { data: [], error: null };
      const chain = chainable(result);
      itemsChains.push(chain);
      return chain;
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { itemsChains };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/items", () => {
  it("sanitizes the search term and drops the dead brand.ilike clause on the count query, matching the page query", async () => {
    const { itemsChains } = setupMocks();

    const res = await GET(
      request("http://localhost/api/admin/items?search=a%27b,c(d)")
    );
    expect(res.status).toBe(200);

    // chains[0] = page query, chains[1] = count query — both must receive the
    // same sanitized, brand-free filter. The raw term has structural
    // characters (',', '(', ')', "'") stripped by sanitizeSearchTerm.
    const expectedFilter = "title.ilike.%a b c d%,description.ilike.%a b c d%";
    expect(itemsChains[0].or).toHaveBeenCalledWith(expectedFilter);
    expect(itemsChains[1].or).toHaveBeenCalledWith(expectedFilter);
  });
});
