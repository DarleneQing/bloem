import { describe, expect, it } from "vitest";
import { isProfileSuspended, ACCOUNT_SUSPENDED_MESSAGE } from "./suspension";

describe("isProfileSuspended", () => {
  it("returns false when profile is null/undefined", () => {
    expect(isProfileSuspended(null)).toBe(false);
    expect(isProfileSuspended(undefined)).toBe(false);
  });

  it("returns false when suspended_at is null", () => {
    expect(isProfileSuspended({ suspended_at: null })).toBe(false);
  });

  it("returns true when suspended_at is set", () => {
    expect(
      isProfileSuspended({ suspended_at: "2026-05-20T10:00:00Z" })
    ).toBe(true);
  });

  it("treats explicit undefined suspended_at as not suspended", () => {
    expect(isProfileSuspended({ suspended_at: undefined as unknown as null })).toBe(false);
  });
});

describe("ACCOUNT_SUSPENDED_MESSAGE", () => {
  it("is a non-empty user-facing string", () => {
    expect(ACCOUNT_SUSPENDED_MESSAGE).toMatch(/suspended/i);
    expect(ACCOUNT_SUSPENDED_MESSAGE.length).toBeGreaterThan(20);
  });
});
