import { describe, expect, it } from "vitest";
import {
  isMarketPastByEndDate,
  isMarketVisibleToUsers,
} from "./user-visibility";

describe("user-visibility", () => {
  it("treats ended markets as past", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    expect(isMarketPastByEndDate(yesterday)).toBe(true);
  });

  it("treats future end dates as not past", () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
    expect(isMarketPastByEndDate(tomorrow)).toBe(false);
  });

  it("hides non-ACTIVE and past ACTIVE markets from users", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();

    expect(isMarketVisibleToUsers({ status: "ACTIVE", end_date: future })).toBe(true);
    expect(isMarketVisibleToUsers({ status: "ACTIVE", end_date: past })).toBe(false);
    expect(isMarketVisibleToUsers({ status: "COMPLETED", end_date: future })).toBe(false);
    expect(
      isMarketVisibleToUsers({ status: "ACTIVE", dates: { end: future } })
    ).toBe(true);
  });
});
