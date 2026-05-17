interface WardrobeStatsRowProps {
  total: number;
  display: number;
  forSale: number;
  sold: number;
}

const STAT_ITEMS = [
  { key: "total", label: "Total items" },
  { key: "display", label: "Display" },
  { key: "forSale", label: "For Sale" },
  { key: "sold", label: "Sold" },
] as const;

export function WardrobeStatsRow({ total, display, forSale, sold }: WardrobeStatsRowProps) {
  const values = { total, display, forSale, sold };

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5 md:mb-6">
      {STAT_ITEMS.map(({ key, label }) => (
        <div
          key={key}
          className="rounded-xl border border-border/60 bg-card px-2 py-3 sm:px-3 sm:py-4 text-center shadow-sm"
        >
          <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
            {values[key]}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground leading-tight">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
