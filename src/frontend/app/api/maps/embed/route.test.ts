import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockGetUser } = vi.hoisted(() => ({ mockGetUser: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

import { GET } from "./route";

const ORIGINAL_KEY = process.env.GOOGLE_MAPS_API_KEY;

function request(qs: Record<string, string>) {
  const url = new URL("http://localhost/api/maps/embed");
  for (const [k, v] of Object.entries(qs)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GOOGLE_MAPS_API_KEY = "test-key-abc";
  mockGetUser.mockResolvedValue({ data: { user: { id: "u-1" } }, error: null });
});
afterEach(() => {
  process.env.GOOGLE_MAPS_API_KEY = ORIGINAL_KEY;
});

describe("GET /api/maps/embed", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await GET(request({ address: "Bahnhofstrasse 1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when address is missing", async () => {
    const res = await GET(request({}));
    expect(res.status).toBe(400);
  });

  it("returns 500 when GOOGLE_MAPS_API_KEY is not set", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    const res = await GET(request({ address: "Bahnhofstrasse 1" }));
    expect(res.status).toBe(500);
  });

  it("302-redirects to Google Maps embed URL on success", async () => {
    const res = await GET(request({ address: "Bahnhofstrasse 1, Zurich" }));
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("google.com/maps/embed");
    expect(location).toContain("Bahnhofstrasse");
    expect(location).toContain("key=test-key-abc");
  });

  it("prepends locationName to query when supplied", async () => {
    const res = await GET(
      request({ address: "Bahnhofstr 1", locationName: "Cafe Bloem" })
    );
    const location = res.headers.get("location") ?? "";
    // URL-encoded — both substrings should appear.
    expect(location).toMatch(/Cafe%20Bloem.*Bahnhofstr/);
  });

  it("does not leak the API key in any error JSON response", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    process.env.GOOGLE_MAPS_API_KEY = "super-secret-key";
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const res = await GET(request({ address: "x" }));
    const body = await res.text();
    expect(body).not.toContain("super-secret-key");
  });
});
