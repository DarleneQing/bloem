import type { LucideIcon } from "lucide-react";
import { Baby, Footprints, Handbag, Shirt, UserRound } from "lucide-react";
import type { Gender, ItemCategory } from "@/types/items";

export type HomeShopCategoryId = "women" | "men" | "accessories" | "sneakers" | "kids";

export interface HomeShopCategory {
  id: HomeShopCategoryId;
  label: string;
  icon: LucideIcon;
  match: (item: { category: ItemCategory; gender: Gender }) => boolean;
}

export const HOME_SHOP_CATEGORIES: HomeShopCategory[] = [
  {
    id: "women",
    label: "Women",
    icon: Shirt,
    match: (item) => item.gender === "WOMEN" || item.gender === "UNISEX",
  },
  {
    id: "men",
    label: "Men",
    icon: UserRound,
    match: (item) => item.gender === "MEN" || item.gender === "UNISEX",
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: Handbag,
    match: (item) =>
      item.category === "ACCESSORIES" ||
      item.category === "BAGS" ||
      item.category === "JEWELRY",
  },
  {
    id: "sneakers",
    label: "Sneakers",
    icon: Footprints,
    match: (item) => item.category === "SHOES",
  },
  {
    id: "kids",
    label: "Kids",
    icon: Baby,
    match: (item) =>
      item.category === "OTHER" ||
      item.category === "TOPS" ||
      item.category === "BOTTOMS",
  },
];

export function getHomeShopCategory(id: string | undefined) {
  if (!id) return undefined;
  return HOME_SHOP_CATEGORIES.find((category) => category.id === id);
}
