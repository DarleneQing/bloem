import { describe, expect, it } from "vitest";
import {
  MARKET_ENROLLMENT_STATUSES,
  isApprovedEnrollment,
  hasEnrollmentApplication,
} from "./enrollment-status";

describe("MARKET_ENROLLMENT_STATUSES", () => {
  it("contains PENDING / APPROVED / REJECTED in that order", () => {
    expect(MARKET_ENROLLMENT_STATUSES).toEqual(["PENDING", "APPROVED", "REJECTED"]);
  });
});

describe("isApprovedEnrollment", () => {
  it("returns true only for APPROVED", () => {
    expect(isApprovedEnrollment("APPROVED")).toBe(true);
    expect(isApprovedEnrollment("PENDING")).toBe(false);
    expect(isApprovedEnrollment("REJECTED")).toBe(false);
  });

  it("returns false for nullish input", () => {
    expect(isApprovedEnrollment(null)).toBe(false);
    expect(isApprovedEnrollment(undefined)).toBe(false);
  });
});

describe("hasEnrollmentApplication", () => {
  it.each(["PENDING", "APPROVED", "REJECTED"] as const)(
    "returns true for %s",
    (status) => expect(hasEnrollmentApplication(status)).toBe(true)
  );

  it("returns false for nullish (no application yet)", () => {
    expect(hasEnrollmentApplication(null)).toBe(false);
    expect(hasEnrollmentApplication(undefined)).toBe(false);
  });
});
