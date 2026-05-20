import { describe, expect, it } from "vitest";
import { parseScannedQRCode } from "./parse-scanned-code";

describe("parseScannedQRCode", () => {
  it("returns the bare code if input is already in BLOEM-…-NNNNN format", () => {
    expect(parseScannedQRCode("BLOEM-TEST-00001")).toBe("BLOEM-TEST-00001");
  });

  it("strips surrounding whitespace", () => {
    expect(parseScannedQRCode("  BLOEM-TEST-00001  ")).toBe("BLOEM-TEST-00001");
  });

  it("extracts the code from a full URL", () => {
    expect(
      parseScannedQRCode("https://bloem.test/qr/BLOEM-TEST-00042")
    ).toBe("BLOEM-TEST-00042");
  });

  it("returns null for empty input", () => {
    expect(parseScannedQRCode("")).toBeNull();
    expect(parseScannedQRCode("   ")).toBeNull();
  });

  it("returns null when no BLOEM- prefix present", () => {
    expect(parseScannedQRCode("hello world")).toBeNull();
  });

  it("returns null when sequence is malformed (3 digits instead of 5)", () => {
    expect(parseScannedQRCode("BLOEM-TEST-001")).toBeNull();
  });

  it("accepts hyphens and underscores in the prefix segment", () => {
    expect(parseScannedQRCode("BLOEM-A_B-C-00007")).toBe("BLOEM-A_B-C-00007");
  });

  it("rejects lowercase prefix characters", () => {
    expect(parseScannedQRCode("BLOEM-test-00001")).toBeNull();
  });

  it("pulls the code out when surrounded by other text", () => {
    expect(parseScannedQRCode("prefix BLOEM-X-99999 suffix")).toBe(
      "BLOEM-X-99999"
    );
  });
});
