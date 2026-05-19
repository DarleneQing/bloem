"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { MarketCard } from "@/components/markets/MarketCard";
import { MarketSummary } from "@/types/markets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type MarketTab = "ACTIVE" | "REGISTERED";

const FILTER_CHIPS: {
  value: MarketTab;
  label: string;
  upcomingOnly?: boolean;
}[] = [
  { value: "ACTIVE", label: "All markets" },
  { value: "ACTIVE", label: "Upcoming", upcomingOnly: true },
  { value: "REGISTERED", label: "Following" },
];

const MARKET_GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:gap-6";

export default function MarketsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search")?.trim() ?? "";

  const [activeTab, setActiveTab] = useState<MarketTab>("ACTIVE");
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [searchOpen, setSearchOpen] = useState(Boolean(initialSearch));
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [followingMarkets, setFollowingMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/markets/favorites")
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json?.marketIds)) {
          setFavoritedIds(new Set(json.marketIds));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    async function load() {
      if (activeTab === "REGISTERED") {
        setLoadingFollowing(true);
        try {
          const res = await fetch(`/api/markets/following`, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (aborted) return;
          const json = await res.json();
          const markets = json?.data?.markets ?? [];
          setFollowingMarkets(markets);
          setFavoritedIds(new Set(markets.map((m: MarketSummary) => m.id)));
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "AbortError") {
            console.error("Failed to fetch following markets:", err);
          }
        } finally {
          if (!aborted) {
            setLoadingFollowing(false);
          }
        }
        return;
      }

      setLoading(true);
      const params = new URLSearchParams({
        status: activeTab,
        sortBy: "start_date",
        sortOrder: "asc",
      });
      if (search.trim()) params.set("search", search.trim());

      try {
        const res = await fetch(`/api/markets?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (aborted) return;
        const json = await res.json();
        setMarkets(json?.data?.markets ?? []);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Failed to fetch markets:", err);
        }
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [activeTab, search]);

  const handleFavoriteChange = useCallback((marketId: string, favorited: boolean) => {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(marketId);
      else next.delete(marketId);
      return next;
    });
    if (!favorited) {
      setFollowingMarkets((prev) => prev.filter((m) => m.id !== marketId));
    }
  }, []);

  const displayedMarkets = useMemo(() => {
    if (activeTab === "REGISTERED") return followingMarkets;
    if (!upcomingOnly) return markets;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return markets.filter((market) => new Date(market.dates.end) >= today);
  }, [activeTab, markets, followingMarkets, upcomingOnly]);

  const isLoading = activeTab === "REGISTERED" ? loadingFollowing : loading;

  function selectChip(chip: (typeof FILTER_CHIPS)[number]) {
    setActiveTab(chip.value);
    setUpcomingOnly(Boolean(chip.upcomingOnly));
  }

  function isChipActive(chip: (typeof FILTER_CHIPS)[number]) {
    if (chip.upcomingOnly) {
      return activeTab === "ACTIVE" && upcomingOnly;
    }
    if (chip.value === "ACTIVE") {
      return activeTab === "ACTIVE" && !upcomingOnly;
    }
    return activeTab === chip.value;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-5 pb-8 md:py-8">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Markets
        </h1>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-foreground"
            aria-label={searchOpen ? "Hide search" : "Search markets"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-foreground"
                aria-label="Filter markets"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Quick filters
              </p>
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  className={cn(
                    "w-full rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted",
                    isChipActive(chip) && "bg-primary/10 font-medium text-primary"
                  )}
                  onClick={() => selectChip(chip)}
                >
                  {chip.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {searchOpen && (
        <div className="mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search markets or location"
            className="h-11 rounded-xl border-border/80 bg-card"
            autoFocus
          />
        </div>
      )}

      <div className="relative -mx-4 mb-5 w-[calc(100%+2rem)] min-w-0 overflow-hidden sm:mx-0 sm:w-full">
        <div
          className="flex w-full min-w-0 flex-nowrap gap-2 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-1 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Market filters"
        >
        {FILTER_CHIPS.map((chip) => {
          const active = isChipActive(chip);
          return (
            <button
              key={chip.label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectChip(chip)}
              className={cn(
                "shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}
            >
              {chip.label}
            </button>
          );
        })}
        </div>
      </div>

      {isLoading ? (
        <MarketGridSkeleton />
      ) : displayedMarkets.length === 0 ? (
        <EmptyMarketsState tab={activeTab} upcomingOnly={upcomingOnly} />
      ) : (
        <div className={MARKET_GRID_CLASS}>
          {displayedMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              favorited={favoritedIds.has(market.id)}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MarketGridSkeleton() {
  return (
    <div className={MARKET_GRID_CLASS}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card"
        >
          <div className="aspect-[16/10] animate-pulse bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyMarketsState({
  tab,
  upcomingOnly,
}: {
  tab: MarketTab;
  upcomingOnly: boolean;
}) {
  const message =
    tab === "REGISTERED"
      ? {
          title: "No followed markets",
          body: "Tap the bookmark on a market to save it here.",
        }
      : upcomingOnly
          ? {
              title: "No upcoming markets",
              body: "Check back soon for new pop-up events.",
            }
          : {
              title: "No markets found",
              body: "Try another filter or search term.",
            };

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <p className="text-lg font-semibold text-foreground">{message.title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message.body}</p>
    </div>
  );
}
