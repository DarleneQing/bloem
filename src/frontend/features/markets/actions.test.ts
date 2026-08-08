import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { registerForMarket } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registerForMarket input validation", () => {
  it("returns a Zod issue instead of throwing on a non-UUID market id", async () => {
    const result = await registerForMarket("not-a-uuid");

    expect(result).toEqual({ error: expect.any(String) });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});
