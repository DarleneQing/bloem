import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

import { createHangerRental } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createHangerRental input validation", () => {
  it("returns a Zod issue instead of throwing on a non-UUID market id", async () => {
    const result = await createHangerRental({ marketId: "not-a-uuid", hangerCount: 2 });

    expect(result).toEqual({ error: expect.any(String) });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});
