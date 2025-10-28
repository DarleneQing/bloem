"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCard } from "@/components/markets/MarketCard";
import { MarketSummary } from "@/types/markets";

export default function MarketsPage() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED" | "REGISTERED">("ACTIVE");
  const [search, setSearch] = useState("");
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [registeredMarkets, setRegisteredMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegistered, setLoadingRegistered] = useState(false);

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    async function load() {
      if (activeTab === "REGISTERED") {
        setLoadingRegistered(true);
        try {
          const res = await fetch(`/api/markets/enrolled`, { cache: "no-store", signal: controller.signal });
          if (aborted) return;
          const json = await res.json();
          setRegisteredMarkets(json?.data?.markets ?? []);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Failed to fetch registered markets:", err);
          }
        } finally {
          if (!aborted) {
            setLoadingRegistered(false);
          }
        }
      } else {
        setLoading(true);
        const params = new URLSearchParams({ status: activeTab, sortBy: "start_date", sortOrder: "asc" });
        if (search.trim()) params.set("search", search.trim());
        try {
          const res = await fetch(`/api/markets?${params.toString()}`, { cache: "no-store", signal: controller.signal });
          if (aborted) return;
          const json = await res.json();
          setMarkets(json?.data?.markets ?? []);
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Failed to fetch markets:", err);
          }
        } finally {
          if (!aborted) {
            setLoading(false);
          }
        }
      }
    }
    load();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [activeTab, search]);

  const filtered = useMemo(() => markets, [markets]);

  return (
    <div className="container py-6 space-y-4">
      <h1 className="text-2xl font-bold">Markets</h1>
      <div className="flex items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="REGISTERED">Registered</TabsTrigger>
          </TabsList>
        </Tabs>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search markets or location"
          className="max-w-xs w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-background"
        />
      </div>
      <Tabs value={activeTab}>
        <TabsContent value="ACTIVE">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <MarketCard key={m.id} market={m} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="COMPLETED">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((m) => (
                <MarketCard key={m.id} market={m} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="REGISTERED">
          {loadingRegistered ? (
            <div>Loading...</div>
          ) : registeredMarkets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No registered markets</p>
              <p className="text-sm mt-2">You haven&apos;t registered for any markets yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {registeredMarkets.map((m) => (
                <MarketCard key={m.id} market={m} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

