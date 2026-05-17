import Link from "next/link";
import { cn } from "@/lib/utils";
import { HOME_SHOP_CATEGORIES, type HomeShopCategoryId } from "@/lib/home/shop-categories";

interface HomeCategoryRowProps {
  activeCategoryId?: HomeShopCategoryId;
}

export function HomeCategoryRow({ activeCategoryId }: HomeCategoryRowProps) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-foreground">Shop by Category</h2>
        <Link href="/home" className="text-sm font-semibold text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-none">
        <div className="flex w-max gap-3">
          {HOME_SHOP_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategoryId === category.id;

            return (
              <Link
                key={category.id}
                href={`/home?shop=${category.id}#popular`}
                className={cn(
                  "flex w-[72px] shrink-0 flex-col items-center gap-2 rounded-2xl border bg-card px-2 py-3 shadow-sm transition-colors",
                  isActive
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "border-border/60 hover:border-primary/20"
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    isActive ? "bg-primary/15 text-primary" : "bg-secondary/20 text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="text-center text-xs font-medium text-foreground">
                  {category.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
