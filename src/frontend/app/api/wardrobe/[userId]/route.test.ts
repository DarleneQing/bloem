import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { GET } from "./route";

const UUID = "11111111-1111-4111-8111-111111111111";

function buildProfileSelectChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function buildItemsSelectChain(result: { data: unknown; error: unknown }) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  };
}

function request() {
  return new Request("http://localhost/api/wardrobe/x") as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/wardrobe/[userId]", () => {
  it("rejects invalid UUID via thrown ZodError → caught path", async () => {
    const res = await GET(request(), {
      params: Promise.resolve({ userId: "not-a-uuid" }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("returns 404 when profile not found", async () => {
    mockFrom.mockReturnValue(
      buildProfileSelectChain({ data: null, error: { message: "no rows" } })
    );
    const res = await GET(request(), {
      params: Promise.resolve({ userId: UUID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when wardrobe is private", async () => {
    mockFrom.mockReturnValue(
      buildProfileSelectChain({
        data: {
          id: UUID,
          first_name: "Jane",
          last_name: "Doe",
          wardrobe_status: "PRIVATE",
          stripe_payouts_enabled: false,
          created_at: "2026-01-01T00:00:00Z",
        },
        error: null,
      })
    );
    const res = await GET(request(), {
      params: Promise.resolve({ userId: UUID }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 200 with items when wardrobe is public", async () => {
    let call = 0;
    mockFrom.mockImplementation(() => {
      call++;
      if (call === 1) {
        return buildProfileSelectChain({
          data: {
            id: UUID,
            first_name: "Jane",
            last_name: "Doe",
            wardrobe_status: "PUBLIC",
            stripe_payouts_enabled: true,
            created_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        });
      }
      return buildItemsSelectChain({ data: [], error: null });
    });

    const res = await GET(request(), {
      params: Promise.resolve({ userId: UUID }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.id).toBe(UUID);
    expect(body.user.fullName).toBe("Jane Doe");
    expect(body.user.isActiveSeller).toBe(true);
    expect(body.user.wardrobePublic).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
  });
});
