import type { Item, ItemCategory, ItemCondition, Gender } from "@/types/items";

interface ItemDetailSpecsProps {
  item: Item & {
    brand?: { name: string } | null;
    size?: { name: string } | null;
    color?: { name: string } | null;
    subcategory?: { name: string } | null;
  };
}

const CONDITION_LABELS: Record<ItemCondition, string> = {
  NEW_WITH_TAGS: "New with tags",
  LIKE_NEW: "Like new",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
};

const GENDER_LABELS: Record<Gender, string> = {
  MEN: "Men",
  WOMEN: "Women",
  UNISEX: "Unisex",
};

function formatCategory(category: ItemCategory) {
  return category
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function ItemDetailSpecs({ item }: ItemDetailSpecsProps) {
  const rows: { label: string; value: string }[] = [];

  if (item.brand?.name) {
    rows.push({ label: "Brand", value: item.brand.name });
  }

  rows.push({ label: "Category", value: formatCategory(item.category) });

  if (item.subcategory?.name) {
    rows.push({ label: "Subcategory", value: item.subcategory.name });
  }

  if (item.size?.name) {
    rows.push({ label: "Size", value: item.size.name });
  }

  rows.push({ label: "Gender", value: GENDER_LABELS[item.gender] });
  rows.push({ label: "Condition", value: CONDITION_LABELS[item.condition] });

  if (item.color?.name) {
    rows.push({ label: "Color", value: item.color.name });
  }

  if (item.purchase_price != null) {
    rows.push({ label: "Purchase price", value: `CHF ${item.purchase_price.toFixed(2)}` });
  }

  if (rows.length === 0 && !item.description) return null;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-foreground">Item details</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        {rows.map((row) => (
          <SpecRow key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>
      {item.description && (
        <div className={rows.length > 0 ? "mt-4 border-t border-border/60 pt-4" : ""}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
            Description
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {item.description}
          </p>
        </div>
      )}
    </section>
  );
}
