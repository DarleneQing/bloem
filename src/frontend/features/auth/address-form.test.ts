import { describe, expect, it } from "vitest";
import { formatEuropeanAddress, parseEuropeanAddress } from "./address-form";

describe("formatEuropeanAddress", () => {
  it("joins parts into a single comma-separated string", () => {
    expect(
      formatEuropeanAddress({
        addressStreet: "Bahnhofstrasse",
        addressHouseNumber: "101",
        addressPostalCode: "8001",
        addressCity: "Zürich",
        addressCountry: "Switzerland",
      })
    ).toBe("101 Bahnhofstrasse, 8001 Zürich, Switzerland");
  });

  it("returns undefined when all parts are empty", () => {
    expect(
      formatEuropeanAddress({
        addressStreet: "",
        addressHouseNumber: "",
        addressPostalCode: "",
        addressCity: "",
        addressCountry: "",
      })
    ).toBeUndefined();
  });
});

describe("parseEuropeanAddress", () => {
  it("round-trips a formatted address", () => {
    const formatted = "101 Bahnhofstrasse, 8001 Zürich, Switzerland";
    const parsed = parseEuropeanAddress(formatted);
    expect(formatEuropeanAddress(parsed)).toBe(formatted);
  });

  it("returns empty fields for null", () => {
    expect(parseEuropeanAddress(null).addressStreet).toBe("");
    expect(parseEuropeanAddress(null).addressCountry).toBe("Switzerland");
  });
});
