export const SELLER_APPLICATION_MIN_PHOTOS = 4;
export const SELLER_APPLICATION_MAX_PHOTOS = 5;

export const SELLER_ITEM_COUNT_RANGES = [
  { id: "1-10", label: "1–10", min: 1, max: 10 },
  { id: "11-25", label: "11–25", min: 11, max: 25 },
  { id: "26-50", label: "26–50", min: 26, max: 50 },
  { id: "51-100", label: "51–100", min: 51, max: 100 },
  { id: "100+", label: "100+", min: 101, max: 500 },
] as const;

export type SellerItemCountRangeId = (typeof SELLER_ITEM_COUNT_RANGES)[number]["id"];

export const SELLER_APPLICATION_BRAND_NAMES = [
  "Levi's",
  "Zara",
  "COS",
  "Patagonia",
  "Arket",
  "Uniqlo",
  "H&M",
  "Nike",
  "Mango",
  "Weekday",
] as const;

export function defaultItemCountForRange(rangeId: SellerItemCountRangeId): number {
  const range = SELLER_ITEM_COUNT_RANGES.find((r) => r.id === rangeId);
  if (!range) return 10;
  if (range.id === "100+") return 101;
  return Math.round((range.min + range.max) / 2);
}

export function clampItemCountForRange(rangeId: SellerItemCountRangeId, count: number): number {
  const range = SELLER_ITEM_COUNT_RANGES.find((r) => r.id === rangeId);
  if (!range) return count;
  if (range.id === "100+") return Math.max(range.min, count);
  return Math.min(range.max, Math.max(range.min, count));
}

export interface SellerApplicationPayload {
  stylePhotoUrls: string[];
  socialMediaConsent: boolean;
  itemCount: number;
  itemCountRange: SellerItemCountRangeId;
  brandIds: string[];
  wantsToVolunteer: boolean;
}

export interface SellerApplicationInitialValues extends SellerApplicationPayload {}

const SELLER_ITEM_COUNT_RANGE_IDS = new Set<string>(
  SELLER_ITEM_COUNT_RANGES.map((range) => range.id)
);

export function isSellerItemCountRangeId(value: string): value is SellerItemCountRangeId {
  return SELLER_ITEM_COUNT_RANGE_IDS.has(value);
}

export function sellerApplicationFromEnrollment(row: {
  style_photo_urls: string[] | null;
  social_media_consent: boolean | null;
  item_count: number | null;
  item_count_range: string | null;
  brand_ids: string[] | null;
  wants_to_volunteer: boolean | null;
}): SellerApplicationInitialValues {
  const itemCountRange: SellerItemCountRangeId = isSellerItemCountRangeId(
    row.item_count_range ?? ""
  )
    ? (row.item_count_range as SellerItemCountRangeId)
    : "11-25";

  return {
    stylePhotoUrls: row.style_photo_urls ?? [],
    socialMediaConsent: row.social_media_consent ?? false,
    itemCount: row.item_count ?? defaultItemCountForRange(itemCountRange),
    itemCountRange,
    brandIds: row.brand_ids ?? [],
    wantsToVolunteer: row.wants_to_volunteer ?? false,
  };
}
