import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from "./route";

function marketsQueryChain(result: { data: unknown; error: unknown; count: number | null }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    then: (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

function request(query: string) {
  return new NextRequest(`http://localhost/api/markets${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/markets", () => {
  it("sanitizes structural characters out of the search term before filtering", async () => {
    const chain = marketsQueryChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);

    await GET(request("?search=" + encodeURIComponent("a\"),or(1eq1")));

    expect(chain.or).toHaveBeenCalledTimes(1);
    const filter = (chain.or as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(filter).not.toContain('"');
    expect(filter).not.toContain(")");
    expect(filter).not.toContain(",1eq1");
  });

  it("returns a generic error and does not leak the raw DB error message", async () => {
    const chain = marketsQueryChain({
      data: null,
      error: { message: "relation \"markets\" secret schema detail" },
      count: null,
    });
    mockFrom.mockReturnValue(chain);

    const res = await GET(request(""));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to fetch markets");
    expect(body.error).not.toContain("secret schema detail");
  });

  it("returns markets on the happy path", async () => {
    const chain = marketsQueryChain({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(chain);

    const res = await GET(request(""));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.markets).toEqual([]);
  });
});
