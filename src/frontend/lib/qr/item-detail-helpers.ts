import type { ItemCategory, ItemCondition, Gender } from "@/types/items";
import { GENDERS, ITEM_CONDITIONS } from "@/types/items";

const CO2_KG_BY_CATEGORY: Record<ItemCategory, number> = {
  TOPS: 6.5,
  BOTTOMS: 8.2,
  DRESSES: 10.4,
  OUTERWEAR: 18.2,
  SHOES: 14.1,
  ACCESSORIES: 3.8,
  BAGS: 9.5,
  JEWELRY: 2.4,
  OTHER: 7.0,
};

export function estimateCo2SavedKg(category: ItemCategory): number {
  return CO2_KG_BY_CATEGORY[category] ?? CO2_KG_BY_CATEGORY.OTHER;
}

export function getConditionLabel(condition: ItemCondition): string {
  return ITEM_CONDITIONS.find((entry) => entry.value === condition)?.label ?? condition;
}

export function getConditionTagLabel(condition: ItemCondition): string | null {
  switch (condition) {
    case "NEW_WITH_TAGS":
    case "LIKE_NEW":
    case "EXCELLENT":
      return "Great condition";
    case "GOOD":
      return "Good condition";
    case "FAIR":
      return "Fair condition";
    default:
      return null;
  }
}

export function isGreatCondition(condition: ItemCondition): boolean {
  return condition === "NEW_WITH_TAGS" || condition === "LIKE_NEW" || condition === "EXCELLENT";
}

export function getGenderShortLabel(gender: Gender): string {
  switch (gender) {
    case "MEN":
      return "M";
    case "WOMEN":
      return "W";
    case "UNISEX":
      return "Unisex";
    default:
      return GENDERS.find((entry) => entry.value === gender)?.label ?? gender;
  }
}

export function formatChfPrice(price: number | null | undefined): string | null {
  if (price == null) return null;
  return `CHF ${price.toFixed(2)}`;
}

export function formatMarketDate(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getSellerDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return full || "Seller";
}

export function getSellerInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "S";
}

/** Unwrap Supabase join shapes (object | array | null). */
export function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}
