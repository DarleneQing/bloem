import { describe, expect, it } from "vitest";
import { getPublicWardrobeDisplayState } from "./public-wardrobe-content";

describe("getPublicWardrobeDisplayState", () => {
  it("shows empty wardrobe when there are no items at all", () => {
    expect(getPublicWardrobeDisplayState(0, 0)).toEqual({
      hasAnyWardrobeItems: false,
      hasFilteredItems: false,
    });
  });

  it("keeps category filter visible when filter returns no items but wardrobe has items", () => {
    expect(getPublicWardrobeDisplayState(5, 0)).toEqual({
      hasAnyWardrobeItems: true,
      hasFilteredItems: false,
    });
  });

  it("shows items when filter has matches", () => {
    expect(getPublicWardrobeDisplayState(5, 2)).toEqual({
      hasAnyWardrobeItems: true,
      hasFilteredItems: true,
    });
  });
});
