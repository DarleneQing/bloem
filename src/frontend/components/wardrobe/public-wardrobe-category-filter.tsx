import Link from "next/link";
import { ITEM_CATEGORIES } from "@/types/items";
import { cn } from "@/lib/utils";

interface PublicWardrobeCategoryFilterProps {
  userId: string;
  activeCategory?: string;
}

export function PublicWardrobeCategoryFilter({
  userId,
  activeCategory,
}: PublicWardrobeCategoryFilterProps) {
  const basePath = `/wardrobe/user/${userId}`;

  return (
    <div className="-mx-4 mb-5 overflow-x-auto px-4 pb-1 scrollbar-none">
      <div className="flex w-max min-w-full gap-2">
        <FilterChip href={basePath} active={!activeCategory} label="All" />
        {ITEM_CATEGORIES.map((cat) => (
          <FilterChip
            key={cat.value}
            href={`${basePath}?category=${cat.value}`}
            active={activeCategory === cat.value}
            label={cat.label}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted/60"
      )}
    >
      {label}
    </Link>
  );
}
