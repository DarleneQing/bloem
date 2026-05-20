import { describe, expect, it } from "vitest";
import {
  estimateCo2SavedKg,
  formatCo2SavedLabel,
  getConditionLabel,
  getConditionTagLabel,
  isGreatCondition,
  getGenderShortLabel,
  formatChfPrice,
  formatMarketDate,
  getSellerDisplayName,
  getSellerInitials,
  unwrapRelation,
} from "./item-detail-helpers";

describe("estimateCo2SavedKg", () => {
  it("returns a positive impact for every known category", () => {
    const cats = ["TOPS", "BOTTOMS", "DRESSES", "OUTERWEAR", "SHOES", "ACCESSORIES", "BAGS", "JEWELRY", "OTHER"] as const;
    for (const c of cats) {
      expect(estimateCo2SavedKg(c)).toBeGreaterThan(0);
    }
  });

  it("OUTERWEAR has highest impact (proxy for new-coat cost)", () => {
    expect(estimateCo2SavedKg("OUTERWEAR")).toBeGreaterThan(
      estimateCo2SavedKg("ACCESSORIES")
    );
  });

  it("DRESSES exceeds TOPS", () => {
    expect(estimateCo2SavedKg("DRESSES")).toBeGreaterThan(
      estimateCo2SavedKg("TOPS")
    );
  });
});

describe("formatCo2SavedLabel", () => {
  it("formats with leading tilde and rounds to nearest int", () => {
    expect(formatCo2SavedLabel(22.4)).toBe("~22");
    expect(formatCo2SavedLabel(22.6)).toBe("~23");
    expect(formatCo2SavedLabel(0)).toBe("~0");
  });
});

describe("getConditionLabel", () => {
  it("returns user-facing labels for known conditions", () => {
    expect(getConditionLabel("NEW_WITH_TAGS")).not.toBe("NEW_WITH_TAGS");
    expect(getConditionLabel("LIKE_NEW")).not.toBe("LIKE_NEW");
  });

  it("falls back to raw value when missing", () => {
    // @ts-expect-error - intentional unknown for fallback
    expect(getConditionLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("getConditionTagLabel", () => {
  it.each([
    ["NEW_WITH_TAGS", "Great condition"],
    ["LIKE_NEW", "Great condition"],
    ["EXCELLENT", "Great condition"],
    ["GOOD", "Good condition"],
    ["FAIR", "Fair condition"],
  ] as const)("maps %s → %s", (cond, expected) => {
    expect(getConditionTagLabel(cond)).toBe(expected);
  });
});

describe("isGreatCondition", () => {
  it("returns true for NEW_WITH_TAGS, LIKE_NEW, EXCELLENT", () => {
    expect(isGreatCondition("NEW_WITH_TAGS")).toBe(true);
    expect(isGreatCondition("LIKE_NEW")).toBe(true);
    expect(isGreatCondition("EXCELLENT")).toBe(true);
  });
  it("returns false for GOOD and FAIR", () => {
    expect(isGreatCondition("GOOD")).toBe(false);
    expect(isGreatCondition("FAIR")).toBe(false);
  });
});

describe("getGenderShortLabel", () => {
  it.each([
    ["MEN", "M"],
    ["WOMEN", "W"],
    ["UNISEX", "Unisex"],
  ] as const)("maps %s → %s", (g, expected) =>
    expect(getGenderShortLabel(g)).toBe(expected)
  );
});

describe("formatChfPrice", () => {
  it("formats to 2dp with CHF prefix", () => {
    expect(formatChfPrice(25)).toBe("CHF 25.00");
    expect(formatChfPrice(9.5)).toBe("CHF 9.50");
  });
  it("returns null for null/undefined", () => {
    expect(formatChfPrice(null)).toBeNull();
    expect(formatChfPrice(undefined)).toBeNull();
  });
  it("returns CHF 0.00 for 0", () => {
    expect(formatChfPrice(0)).toBe("CHF 0.00");
  });
});

describe("formatMarketDate", () => {
  it("returns long-form en-US date", () => {
    expect(formatMarketDate("2026-06-15T10:00:00Z")).toMatch(
      /June 1[45], 2026/
    );
  });
  it("returns null for null/undefined", () => {
    expect(formatMarketDate(null)).toBeNull();
    expect(formatMarketDate(undefined)).toBeNull();
  });
});

describe("getSellerDisplayName", () => {
  it("concatenates first and last", () => {
    expect(getSellerDisplayName("Jane", "Doe")).toBe("Jane Doe");
  });
  it("handles missing first or last", () => {
    expect(getSellerDisplayName("Jane", null)).toBe("Jane");
    expect(getSellerDisplayName(null, "Doe")).toBe("Doe");
  });
  it("falls back to 'Seller' when both missing", () => {
    expect(getSellerDisplayName(null, null)).toBe("Seller");
    expect(getSellerDisplayName(undefined, undefined)).toBe("Seller");
    expect(getSellerDisplayName("", "")).toBe("Seller");
  });
});

describe("getSellerInitials", () => {
  it("uppercases first letter of each name", () => {
    expect(getSellerInitials("jane", "doe")).toBe("JD");
  });
  it("falls back to 'S' when both names empty", () => {
    expect(getSellerInitials(null, null)).toBe("S");
    expect(getSellerInitials("", "")).toBe("S");
  });
  it("uses just one initial if only one name present", () => {
    expect(getSellerInitials("Jane", null)).toBe("J");
    expect(getSellerInitials(null, "Doe")).toBe("D");
  });
});

describe("unwrapRelation", () => {
  it("returns the single object as-is", () => {
    expect(unwrapRelation({ id: "x" })).toEqual({ id: "x" });
  });
  it("returns the first element when given an array", () => {
    expect(unwrapRelation([{ id: "first" }, { id: "second" }])).toEqual({
      id: "first",
    });
  });
  it("returns null for empty arrays", () => {
    expect(unwrapRelation([])).toBeNull();
  });
  it("returns null for null/undefined", () => {
    expect(unwrapRelation(null)).toBeNull();
    expect(unwrapRelation(undefined)).toBeNull();
  });
});
