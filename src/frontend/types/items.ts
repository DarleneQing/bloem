// Item-related types from database schema

export type ItemStatus =
  | "WARDROBE"
  | "RACK"
  | "SOLD";

export type ItemCategory =
  | "TOPS"
  | "BOTTOMS"
  | "DRESSES"
  | "OUTERWEAR"
  | "SHOES"
  | "ACCESSORIES"
  | "BAGS"
  | "JEWELRY"
  | "OTHER";

export type ItemCondition =
  | "NEW_WITH_TAGS"
  | "LIKE_NEW"
  | "EXCELLENT"
  | "GOOD"
  | "FAIR";

export type ItemSize =
  | "XXS"
  | "XS"
  | "S"
  | "M"
  | "L"
  | "XL"
  | "XXL"
  | "XXXL"
  | "ONE_SIZE";

export interface Item {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  brand: string | null;
  category: ItemCategory;
  size: ItemSize | null;
  condition: ItemCondition;
  color: string | null;
  selling_price: number | null;
  status: ItemStatus;
  image_urls: string[];
  thumbnail_url: string;
  market_id: string | null;
  listed_at: string | null;
  sold_at: string | null;
  buyer_id: string | null;
  created_at: string;
  updated_at: string;
}

export const ITEM_CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "TOPS", label: "Tops" },
  { value: "BOTTOMS", label: "Bottoms" },
  { value: "DRESSES", label: "Dresses" },
  { value: "OUTERWEAR", label: "Outerwear" },
  { value: "SHOES", label: "Shoes" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "BAGS", label: "Bags" },
  { value: "JEWELRY", label: "Jewelry" },
  { value: "OTHER", label: "Other" },
];

export const ITEM_CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: "NEW_WITH_TAGS", label: "New with Tags" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

export const ITEM_SIZES: { value: ItemSize; label: string }[] = [
  { value: "XXS", label: "XXS" },
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
  { value: "XXXL", label: "XXXL" },
  { value: "ONE_SIZE", label: "One Size" },
];

