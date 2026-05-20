import { describe, expect, it } from "vitest";
import {
  HOME_SHOP_CATEGORIES,
  getHomeShopCategory,
  type HomeShopCategoryId,
} from "./shop-categories";

describe("HOME_SHOP_CATEGORIES", () => {
  it("exposes the 5 documented categories in order", () => {
    expect(HOME_SHOP_CATEGORIES.map((c) => c.id)).toEqual([
      "women",
      "men",
      "accessories",
      "sneakers",
      "kids",
    ]);
  });

  it("each entry has a label, icon and match predicate", () => {
    for (const cat of HOME_SHOP_CATEGORIES) {
      expect(typeof cat.label).toBe("string");
      expect(cat.label.length).toBeGreaterThan(0);
      expect(typeof cat.icon).toBe("object"); // Lucide icons are React components (forwardRef objects)
      expect(typeof cat.match).toBe("function");
    }
  });
});

describe("getHomeShopCategory", () => {
  it.each(["women", "men", "accessories", "sneakers", "kids"])(
    "looks up '%s'",
    (id) => {
      expect(getHomeShopCategory(id)?.id).toBe(id as HomeShopCategoryId);
    }
  );

  it("returns undefined for unknown id", () => {
    expect(getHomeShopCategory("nope")).toBeUndefined();
  });

  it("returns undefined for empty string or undefined", () => {
    expect(getHomeShopCategory("")).toBeUndefined();
    expect(getHomeShopCategory(undefined)).toBeUndefined();
  });
});

// ----- match predicate behavior --------------------------------------------

function findMatcher(id: HomeShopCategoryId) {
  const cat = getHomeShopCategory(id)!;
  return cat.match;
}

describe("women matcher", () => {
  it("matches gender=WOMEN regardless of category", () => {
    expect(findMatcher("women")({ gender: "WOMEN", category: "TOPS" })).toBe(true);
    expect(findMatcher("women")({ gender: "WOMEN", category: "SHOES" })).toBe(true);
  });
  it("matches gender=UNISEX (shared catalogue surfaces under both genders)", () => {
    expect(findMatcher("women")({ gender: "UNISEX", category: "TOPS" })).toBe(true);
  });
  it("does not match gender=MEN", () => {
    expect(findMatcher("women")({ gender: "MEN", category: "TOPS" })).toBe(false);
  });
});

describe("men matcher", () => {
  it("matches gender=MEN and UNISEX", () => {
    expect(findMatcher("men")({ gender: "MEN", category: "TOPS" })).toBe(true);
    expect(findMatcher("men")({ gender: "UNISEX", category: "TOPS" })).toBe(true);
  });
  it("does not match gender=WOMEN", () => {
    expect(findMatcher("men")({ gender: "WOMEN", category: "TOPS" })).toBe(false);
  });
});

describe("accessories matcher", () => {
  it.each(["ACCESSORIES", "BAGS", "JEWELRY"] as const)("matches category=%s", (c) => {
    expect(findMatcher("accessories")({ gender: "WOMEN", category: c })).toBe(true);
  });
  it("does not match TOPS / BOTTOMS / SHOES", () => {
    expect(findMatcher("accessories")({ gender: "WOMEN", category: "TOPS" })).toBe(false);
    expect(findMatcher("accessories")({ gender: "WOMEN", category: "BOTTOMS" })).toBe(false);
    expect(findMatcher("accessories")({ gender: "WOMEN", category: "SHOES" })).toBe(false);
  });
});

describe("sneakers matcher", () => {
  it("matches category=SHOES only", () => {
    expect(findMatcher("sneakers")({ gender: "WOMEN", category: "SHOES" })).toBe(true);
    expect(findMatcher("sneakers")({ gender: "WOMEN", category: "TOPS" })).toBe(false);
  });
});

describe("kids matcher", () => {
  it("matches OTHER / TOPS / BOTTOMS (cross-cuts other matchers — codified)", () => {
    expect(findMatcher("kids")({ gender: "UNISEX", category: "OTHER" })).toBe(true);
    expect(findMatcher("kids")({ gender: "WOMEN", category: "TOPS" })).toBe(true);
    expect(findMatcher("kids")({ gender: "MEN", category: "BOTTOMS" })).toBe(true);
  });
  it("does not match DRESSES / OUTERWEAR / SHOES / ACCESSORIES / BAGS / JEWELRY", () => {
    for (const c of ["DRESSES", "OUTERWEAR", "SHOES", "ACCESSORIES", "BAGS", "JEWELRY"] as const) {
      expect(findMatcher("kids")({ gender: "WOMEN", category: c }), c).toBe(false);
    }
  });
});
