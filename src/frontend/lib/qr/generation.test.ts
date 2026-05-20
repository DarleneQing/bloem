import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  formatQRCode,
  generateBatchCodes,
  generateQRCodeURL,
  getQRCodeBaseURL,
  validateQRCodeFormat,
  extractPrefixFromCode,
  extractNumberFromCode,
} from "./generation";

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

describe("formatQRCode", () => {
  it("zero-pads sequence to 5 digits", () => {
    expect(formatQRCode("MARKET01", 1)).toBe("BLOEM-MARKET01-00001");
    expect(formatQRCode("X", 42)).toBe("BLOEM-X-00042");
    expect(formatQRCode("BIG", 99999)).toBe("BLOEM-BIG-99999");
  });

  it("supports prefixes with hyphens and underscores", () => {
    expect(formatQRCode("A_B-C", 7)).toBe("BLOEM-A_B-C-00007");
  });
});

describe("generateBatchCodes", () => {
  it("creates an array of length=count", () => {
    expect(generateBatchCodes("X", 5)).toHaveLength(5);
  });

  it("first code is …-00001 and last is …-NNNNN", () => {
    const codes = generateBatchCodes("X", 12);
    expect(codes[0]).toBe("BLOEM-X-00001");
    expect(codes[11]).toBe("BLOEM-X-00012");
  });

  it("returns empty for count=0", () => {
    expect(generateBatchCodes("X", 0)).toEqual([]);
  });
});

describe("getQRCodeBaseURL / generateQRCodeURL", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("falls back to the production URL when env is unset", () => {
    expect(getQRCodeBaseURL()).toBe("https://app.bloem.com");
  });

  it("strips trailing slash from env URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://staging.bloem.test/";
    expect(getQRCodeBaseURL()).toBe("https://staging.bloem.test");
  });

  it("joins base URL with /qr/<code>", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://bloem.test";
    expect(generateQRCodeURL("BLOEM-X-00001")).toBe(
      "https://bloem.test/qr/BLOEM-X-00001"
    );
  });
});

describe("validateQRCodeFormat", () => {
  it.each([
    ["BLOEM-TEST-00001", true],
    ["BLOEM-A_B-C-99999", true],
    ["BLOEM-X-00000", true],
    ["TEST-00001", false],
    ["BLOEM-TEST-0001", false], // 4 digits
    ["BLOEM-test-00001", false], // lowercase
    ["BLOEM--00001", false],
    ["", false],
  ])("validates %s as %s", (code, expected) => {
    expect(validateQRCodeFormat(code)).toBe(expected);
  });
});

describe("extractPrefixFromCode", () => {
  it("returns the prefix segment", () => {
    expect(extractPrefixFromCode("BLOEM-MARKET01-00001")).toBe("MARKET01");
    expect(extractPrefixFromCode("BLOEM-A_B-C-00007")).toBe("A_B-C");
  });
  it("returns null on malformed input", () => {
    expect(extractPrefixFromCode("not-a-code")).toBeNull();
    expect(extractPrefixFromCode("BLOEM-x-00001")).toBeNull(); // lowercase
  });
});

describe("extractNumberFromCode", () => {
  it("parses the numeric suffix as integer", () => {
    expect(extractNumberFromCode("BLOEM-X-00042")).toBe(42);
    expect(extractNumberFromCode("BLOEM-X-99999")).toBe(99999);
    expect(extractNumberFromCode("BLOEM-X-00001")).toBe(1);
  });
  it("returns null on malformed input", () => {
    expect(extractNumberFromCode("not-a-code")).toBeNull();
    expect(extractNumberFromCode("BLOEM-X-1")).toBeNull(); // wrong length
  });
});
