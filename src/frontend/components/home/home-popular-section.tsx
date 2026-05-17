import Link from "next/link";
import type { DiscoverableRackItem } from "@/features/items/queries";
import { getHomeShopCategory } from "@/lib/home/shop-categories";
import type { HomeShopCategoryId } from "@/lib/home/shop-categories";
import { HomePopularItemCard } from "@/components/home/home-popular-item-card";

interface HomePopularSectionProps {
  items: DiscoverableRackItem[];
  activeCategoryId?: HomeShopCategoryId;
}

export function HomePopularSection({ items, activeCategoryId }: HomePopularSectionProps) {
  const category = getHomeShopCategory(activeCategoryId);
  const filteredItems = category ? items.filter(category.match) : items;
  const displayItems = filteredItems.slice(0, 12);

  return (
    <section id="popular" className="mb-6 scroll-mt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-foreground">Picked for You</h2>
        <Link href="/markets" className="text-sm font-semibold text-primary hover:underline">
          See all
        </Link>
      </div>

      {displayItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-10 text-center">
          <p className="text-sm font-medium text-foreground">No items to show yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {category
              ? `Nothing listed in ${category.label.toLowerCase()} right now. Try another category or browse markets.`
              : "Visit a market and scan items as sellers list them on the rack."}
          </p>
          <Link
            href="/markets"
            className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            Explore markets
          </Link>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-none">
          <div className="flex w-max gap-3">
            {displayItems.map((item) => (
              <HomePopularItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
