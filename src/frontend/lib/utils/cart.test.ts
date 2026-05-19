import { describe, expect, it } from "vitest";
import {
  canExtendReservation,
  computeExtendedExpiresAt,
  getMaxReservationExpiresAt,
} from "./cart";
import {
  MAX_TOTAL_RESERVATION_MS,
  RESERVATION_DURATION_MS,
} from "@/types/carts";

function isoAfterMs(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

describe("reservation 1 hour cap", () => {
  it("computes max expiry as reserved_at + 1 hour", () => {
    const reservedAt = isoAfterMs(60_000);
    const max = getMaxReservationExpiresAt(reservedAt);
    expect(max.getTime()).toBe(new Date(reservedAt).getTime() + MAX_TOTAL_RESERVATION_MS);
  });

  it("adds 15 minutes per extend until cap", () => {
    const reservedAt = isoAfterMs(60_000);
    const reservedMs = new Date(reservedAt).getTime();

    const afterFirst = computeExtendedExpiresAt(
      reservedAt,
      new Date(reservedMs + RESERVATION_DURATION_MS).toISOString()
    );
    expect(afterFirst.getTime()).toBe(reservedMs + RESERVATION_DURATION_MS * 2);

    const atCap = computeExtendedExpiresAt(
      reservedAt,
      new Date(reservedMs + MAX_TOTAL_RESERVATION_MS - 10 * 60_000).toISOString()
    );
    expect(atCap.getTime()).toBe(reservedMs + MAX_TOTAL_RESERVATION_MS);
  });

  it("blocks extend at 1 hour cap", () => {
    const reservedAt = isoAfterMs(60_000);
    const reservedMs = new Date(reservedAt).getTime();
    const maxExpires = new Date(reservedMs + MAX_TOTAL_RESERVATION_MS).toISOString();

    expect(
      canExtendReservation(
        2,
        new Date(reservedMs + 45 * 60_000).toISOString(),
        reservedAt
      )
    ).toBe(true);

    expect(canExtendReservation(4, maxExpires, reservedAt)).toBe(false);
    expect(canExtendReservation(2, maxExpires, reservedAt)).toBe(false);
  });
});
