import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { MarketSummary } from "@/types/markets";
import { cn } from "@/lib/utils";
import { MarketBookmarkButton } from "./MarketBookmarkButton";

interface Props {
  market: MarketSummary;
  favorited?: boolean;
  onFavoriteChange?: (marketId: string, favorited: boolean) => void;
}

function formatMarketDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const datePart = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const weekday = start.toLocaleDateString("en-US", { weekday: "short" });

  if (sameDay) {
    return `${datePart} · ${weekday}`;
  }

  const endPart = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${datePart} – ${endPart}`;
}

function getCapacityBadge(market: MarketSummary): {
  label: string;
  className: string;
} {
  const spots = market.capacity.availableSpots;
  const hangers = market.capacity.availableHangers;
  const maxVendors = market.capacity.maxVendors;
  const currentVendors = market.capacity.currentVendors;

  if (spots === 0 || hangers === 0) {
    return {
      label: "Almost full",
      className: "bg-amber-100 text-amber-900",
    };
  }

  if (maxVendors > 0 && currentVendors / maxVendors >= 0.85) {
    return {
      label: "Almost full",
      className: "bg-amber-100 text-amber-900",
    };
  }

  if (spots > 0 && spots <= 15) {
    return {
      label: `${spots} spot${spots === 1 ? "" : "s"} left`,
      className: "bg-brand-accent text-foreground",
    };
  }

  return {
    label: "Vendor open",
    className: "bg-brand-accent text-foreground",
  };
}

export function MarketCard({ market, favorited = false, onFavoriteChange }: Props) {
  const badge = getCapacityBadge(market);
  const locationLabel =
    market.location.name?.trim() ||
    [market.location.address].filter(Boolean).join(", ") ||
    "Location TBA";

  return (
    <Link href={`/markets/${market.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={market.pictureUrl || "/assets/images/brand-transparent.png"}
            alt={market.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
              badge.className
            )}
          >
            {badge.label}
          </span>
        </div>

        <div className="space-y-2 p-4">
          <h2 className="line-clamp-2 text-lg font-bold leading-snug text-foreground">
            {market.name}
          </h2>

          <p className="text-sm text-muted-foreground">
            {formatMarketDateRange(market.dates.start, market.dates.end)}
          </p>

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/80" aria-hidden />
            <span className="line-clamp-1">{locationLabel}</span>
          </p>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-base font-bold text-primary">
              CHF {Number(market.pricing.hangerPrice).toFixed(0)}
              <span className="font-semibold text-primary/80"> / hanger</span>
            </p>
            <MarketBookmarkButton
              marketId={market.id}
              initialFavorited={favorited}
              onFavoriteChange={onFavoriteChange}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
