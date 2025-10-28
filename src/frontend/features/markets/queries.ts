import { MarketCapacityResult, MarketDetail, MarketListFilters, MarketSummary } from "@/types/markets";
import { marketListQuerySchema } from "./validations";

export async function getMarkets(filters?: Partial<MarketListFilters>): Promise<MarketSummary[]> {
  const params = marketListQuerySchema.partial().parse({
    status: filters?.status ?? "ACTIVE",
    search: filters?.search,
    page: filters?.page ?? 1,
    limit: filters?.limit ?? 20,
    sortBy: filters?.sortBy ?? "start_date",
    sortOrder: filters?.sortOrder ?? "asc",
  });

  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) qs.set(k, String(v));
  });

  const res = await fetch(`/api/markets?${qs.toString()}`, { cache: "no-store" });
  const json = await res.json();
  if (!json?.success) return [];
  return json.data.markets as MarketSummary[];
}

export async function getMarketById(id: string): Promise<MarketDetail | null> {
  // Reuse admin formatter once available; for now, fetch from public list then filter
  const list = await getMarkets({ status: "all", limit: 50, sortBy: "start_date" });
  const found = list.find((m) => m.id === id);
  return found ? (found as MarketDetail) : null;
}

export async function getMarketCapacity(id: string): Promise<MarketCapacityResult> {
  const res = await fetch(`/api/markets/${id}/capacity`, { cache: "no-store" });
  const json = await res.json();
  return json?.data as MarketCapacityResult;
}

