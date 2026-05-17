import Link from "next/link";
import Image from "next/image";
import type { EnrichedItem } from "@/features/items/queries";
import { ITEM_CONDITIONS } from "@/types/items";
import { StatusBadge } from "./status-badge";

interface ItemCardProps {
  item: EnrichedItem;
  variant?: "default" | "wardrobe" | "public";
}

function formatBrandSize(item: EnrichedItem) {
  const brandName =
    item.brand && (typeof item.brand === "string" ? item.brand : item.brand.name);
  const sizeName =
    item.size && (typeof item.size === "string" ? item.size : item.size.name);

  if (brandName && sizeName) {
    return `${brandName} • ${sizeName}`;
  }

  return brandName ?? sizeName ?? null;
}

function formatSizeCondition(item: EnrichedItem) {
  const sizeName =
    item.size && (typeof item.size === "string" ? item.size : item.size.name);
  const conditionLabel =
    ITEM_CONDITIONS.find((entry) => entry.value === item.condition)?.label ??
    item.condition;

  if (sizeName) {
    return `${sizeName} • ${conditionLabel}`;
  }

  return conditionLabel;
}

export function ItemCard({ item, variant = "default" }: ItemCardProps) {
  const brandSize = formatBrandSize(item);
  const sizeCondition = formatSizeCondition(item);
  const isWardrobe = variant === "wardrobe";
  const isCompact = isWardrobe || variant === "public";

  return (
    <Link href={`/wardrobe/${item.id}`} className="group block">
      <article
        className={
          isWardrobe
            ? "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow duration-200 group-hover:shadow-md"
            : isCompact
              ? "overflow-hidden"
              : "overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:scale-102 hover:shadow-xl"
        }
      >
        <div
          className={`relative bg-muted ${
            isWardrobe
              ? "aspect-square overflow-hidden"
              : isCompact
                ? "aspect-square overflow-hidden rounded-2xl"
                : "aspect-[4/5]"
          }`}
        >
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {variant !== "public" && (
            <div className="absolute right-2 top-2">
              <StatusBadge
                status={item.status}
                variant={isCompact ? "overlay" : "default"}
              />
            </div>
          )}
        </div>

        <div className={isWardrobe ? "px-3 pb-3 pt-2.5" : isCompact ? "pt-2.5 pb-1" : "p-4"}>
          <h3
            className={`truncate font-bold text-foreground ${
              isCompact ? "text-sm" : "mb-1 text-base"
            }`}
          >
            {item.title}
          </h3>

          {variant === "public" ? (
            <>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{sizeCondition}</p>
              {item.selling_price != null && (
                <p className="mt-1.5 text-sm font-bold text-foreground">
                  CHF {item.selling_price.toFixed(2)}
                </p>
              )}
            </>
          ) : isCompact ? (
            <>
              {brandSize && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{brandSize}</p>
              )}
              {item.selling_price != null && (
                <p className="mt-1.5 text-sm font-bold text-foreground">
                  CHF {item.selling_price.toFixed(2)}
                </p>
              )}
            </>
          ) : (
            <>
              {item.brand && (
                <p className="mb-2 truncate text-sm text-muted-foreground">
                  {typeof item.brand === "string" ? item.brand : item.brand.name}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <span className="capitalize">{item.category.toLowerCase()}</span>
                  {item.size && (
                    <span>
                      {" "}
                      • {typeof item.size === "string" ? item.size : item.size.name}
                    </span>
                  )}
                </div>
                {item.selling_price != null && (
                  <p className="font-bold text-primary">
                    CHF {item.selling_price.toFixed(2)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </article>
    </Link>
  );
}
