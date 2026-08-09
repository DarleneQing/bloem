import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

import { cancelHangerRental, createHangerRental } from "./actions";

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

describe("cancelHangerRental", () => {
  it("rejects a non-UUID rental id before touching Supabase", async () => {
    const result = await cancelHangerRental("not-a-uuid");

    expect(result).toEqual({ error: expect.any(String) });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("cancels a pending rental via the RPC and reports success", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      rpc,
    });

    const rentalId = "11111111-1111-4111-8111-111111111111";
    const result = await cancelHangerRental(rentalId);

    expect(rpc).toHaveBeenCalledWith("rpc_cancel_hanger_rental", {
      p_seller: "user-1",
      p_rental: rentalId,
    });
    expect(result).toEqual({ success: true });
  });
});
