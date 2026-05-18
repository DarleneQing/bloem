/** Markets users may browse, enroll in, or open by direct link. */
export const USER_VISIBLE_MARKET_STATUS = "ACTIVE" as const;

export function isMarketPastByEndDate(endDateIso: string | null | undefined): boolean {
  if (!endDateIso) return false;
  const end = new Date(endDateIso);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < Date.now();
}

export function isMarketVisibleToUsers(market: {
  status: string;
  end_date?: string | null;
  dates?: { end: string };
}): boolean {
  if (market.status !== USER_VISIBLE_MARKET_STATUS) return false;
  const end = market.dates?.end ?? market.end_date;
  return !isMarketPastByEndDate(end ?? undefined);
}

/** ISO timestamp for Supabase `.gte("end_date", …)` filters. */
export function userVisibleMarketsEndDateMin(now = new Date()): string {
  return now.toISOString();
}
