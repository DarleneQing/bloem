import { describe, expect, it } from "vitest";
import {
  SELLER_APPLICATION_MIN_PHOTOS,
  SELLER_APPLICATION_MAX_PHOTOS,
  SELLER_ITEM_COUNT_RANGES,
  SELLER_APPLICATION_BRAND_NAMES,
  defaultItemCountForRange,
  clampItemCountForRange,
  isSellerItemCountRangeId,
  sellerApplicationFromEnrollment,
  type SellerItemCountRangeId,
} from "./seller-application";

describe("seller application constants", () => {
  it("requires between 4 and 5 photos", () => {
    expect(SELLER_APPLICATION_MIN_PHOTOS).toBe(4);
    expect(SELLER_APPLICATION_MAX_PHOTOS).toBe(5);
  });

  it("exposes 5 contiguous item-count ranges including 100+", () => {
    expect(SELLER_ITEM_COUNT_RANGES.map((r) => r.id)).toEqual([
      "1-10",
      "11-25",
      "26-50",
      "51-100",
      "100+",
    ]);
  });

  it("brand names include common Swiss-market labels", () => {
    expect(SELLER_APPLICATION_BRAND_NAMES).toContain("Levi's");
    expect(SELLER_APPLICATION_BRAND_NAMES).toContain("Patagonia");
    expect(SELLER_APPLICATION_BRAND_NAMES.length).toBeGreaterThanOrEqual(10);
  });
});

describe("defaultItemCountForRange", () => {
  it("returns midpoint for bounded ranges", () => {
    expect(defaultItemCountForRange("1-10")).toBe(6); // round((1+10)/2)=5.5→6
    expect(defaultItemCountForRange("11-25")).toBe(18);
    expect(defaultItemCountForRange("26-50")).toBe(38);
    expect(defaultItemCountForRange("51-100")).toBe(76); // round((51+100)/2)=75.5→76
  });

  it("returns 101 for unbounded 100+ range", () => {
    expect(defaultItemCountForRange("100+")).toBe(101);
  });

  it("returns 10 for unknown range (defensive fallback)", () => {
    expect(defaultItemCountForRange("nope" as SellerItemCountRangeId)).toBe(10);
  });
});

describe("clampItemCountForRange", () => {
  it("clamps low values up to min", () => {
    expect(clampItemCountForRange("11-25", 5)).toBe(11);
    expect(clampItemCountForRange("26-50", 0)).toBe(26);
  });

  it("clamps high values down to max", () => {
    expect(clampItemCountForRange("11-25", 1000)).toBe(25);
    expect(clampItemCountForRange("1-10", 50)).toBe(10);
  });

  it("100+ has no upper bound, only floor at min=101", () => {
    expect(clampItemCountForRange("100+", 500)).toBe(500);
    expect(clampItemCountForRange("100+", 50)).toBe(101);
  });

  it("returns count untouched for unknown range (defensive)", () => {
    expect(clampItemCountForRange("nope" as SellerItemCountRangeId, 42)).toBe(42);
  });
});

describe("isSellerItemCountRangeId", () => {
  it.each(["1-10", "11-25", "26-50", "51-100", "100+"])(
    "accepts %s",
    (id) => expect(isSellerItemCountRangeId(id)).toBe(true)
  );

  it.each(["", "0-5", "1000+", "11_25", "ANY"])(
    "rejects %s",
    (id) => expect(isSellerItemCountRangeId(id)).toBe(false)
  );
});

describe("sellerApplicationFromEnrollment", () => {
  const baseRow = {
    style_photo_urls: ["https://a", "https://b", "https://c", "https://d"],
    social_media_consent: true,
    item_count: 18,
    item_count_range: "11-25",
    brand_ids: ["b1", "b2"],
    wants_to_volunteer: false,
  };

  it("maps a complete row 1:1", () => {
    expect(sellerApplicationFromEnrollment(baseRow)).toEqual({
      stylePhotoUrls: baseRow.style_photo_urls,
      socialMediaConsent: true,
      itemCount: 18,
      itemCountRange: "11-25",
      brandIds: baseRow.brand_ids,
      wantsToVolunteer: false,
    });
  });

  it("falls back to defaults for nulls", () => {
    const out = sellerApplicationFromEnrollment({
      style_photo_urls: null,
      social_media_consent: null,
      item_count: null,
      item_count_range: null,
      brand_ids: null,
      wants_to_volunteer: null,
    });
    expect(out.stylePhotoUrls).toEqual([]);
    expect(out.socialMediaConsent).toBe(false);
    expect(out.brandIds).toEqual([]);
    expect(out.wantsToVolunteer).toBe(false);
    expect(out.itemCountRange).toBe("11-25");
    expect(out.itemCount).toBe(18); // midpoint of 11-25 default
  });

  it("coerces unknown item_count_range to the default '11-25'", () => {
    const out = sellerApplicationFromEnrollment({
      ...baseRow,
      item_count_range: "weird-value",
      item_count: null,
    });
    expect(out.itemCountRange).toBe("11-25");
    expect(out.itemCount).toBe(18);
  });
});
