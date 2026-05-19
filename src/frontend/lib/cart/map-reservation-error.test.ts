import { describe, expect, it } from "vitest";
import { mapReservationRpcError } from "./map-reservation-error";

describe("mapReservationRpcError", () => {
  it("maps reserved item conflict", () => {
    expect(
      mapReservationRpcError({
        message: "item_not_available:RESERVED",
        code: "22023",
      })
    ).toBe("This item is currently reserved by another buyer");
  });

  it("maps unique constraint to already in cart", () => {
    expect(
      mapReservationRpcError({
        message: "duplicate key",
        code: "23505",
      })
    ).toBe("This item is already in a cart");
  });
});
