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

export type Gender = "MEN" | "WOMEN" | "UNISEX";

// New types for foreign key attributes
export interface Brand {
  id: string;
  name: string;
  created_by_user: string | null;
  is_system: boolean;
}

export interface Color {
  id: string;
  name: string;
  hex_code: string | null;
}

export interface Size {
  id: string;
  name: string;
  size_type: "letter" | "numeric" | "eu_shoe";
  display_order: number;
}

export interface Subcategory {
  id: string;
  category: ItemCategory;
  name: string;
}

export interface Item {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  brand_id: string | null;
  category: ItemCategory;
  size_id: string | null;
  condition: ItemCondition;
  color_id: string | null;
  subcategory_id: string | null;
  gender: Gender;
  purchase_price: number | null;
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

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "MEN", label: "Men" },
  { value: "WOMEN", label: "Women" },
  { value: "UNISEX", label: "Unisex" },
];

