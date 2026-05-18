"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface MarketOption {
  id: string;
  name: string;
  status: string;
}

interface SellerOwed {
  sellerId: string;
  name: string;
  email: string;
  stripeAccountId: string | null;
  stripeReady: boolean;
  amountOwed: number;
}

export function AdminStripePayouts() {
  const [markets, setMarkets] = useState<MarketOption[]>([]);
  const [marketId, setMarketId] = useState<string>("");
  const [sellers, setSellers] = useState<SellerOwed[]>([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarkets() {
      try {
        setLoadingMarkets(true);
        const response = await fetch("/api/admin/markets?limit=100&status=all");
        const data = await response.json();
        if (data?.success && data?.data?.markets?.length) {
          const options = data.data.markets.map((m: MarketOption) => ({
            id: m.id,
            name: m.name,
            status: m.status,
          }));
          setMarkets(options);
          if (options.length === 1) {
            setMarketId(options[0].id);
          }
        }
      } catch {
        setError("Failed to load markets");
      } finally {
        setLoadingMarkets(false);
      }
    }
    loadMarkets();
  }, []);

  const loadSellers = useCallback(async (selectedMarketId: string) => {
    if (!selectedMarketId) {
      setSellers([]);
      return;
    }
    setLoadingSellers(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/payouts/market/${selectedMarketId}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to load seller balances");
        setSellers([]);
        return;
      }
      setSellers(data.data?.sellers ?? []);
    } catch {
      setError("Failed to load seller balances");
      setSellers([]);
    } finally {
      setLoadingSellers(false);
    }
  }, []);

  useEffect(() => {
    if (marketId) {
      loadSellers(marketId);
    }
  }, [marketId, loadSellers]);

  const paySeller = async (seller: SellerOwed) => {
    if (!marketId || !seller.stripeReady) return;
    setPayingId(seller.sellerId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId, sellerId: seller.sellerId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Transfer failed");
        return;
      }
      setMessage(
        `Transferred CHF ${data.data?.amount?.toFixed(2) ?? seller.amountOwed.toFixed(2)} to ${seller.name}`
      );
      await loadSellers(marketId);
    } catch {
      setError("Transfer failed");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card p-4 md:p-6 space-y-4">
        <div>
          <label htmlFor="market-select" className="text-sm font-medium text-foreground">
            Market
          </label>
          <Select
            value={marketId}
            onValueChange={setMarketId}
            disabled={loadingMarkets || markets.length === 0}
          >
            <SelectTrigger id="market-select" className="mt-2">
              <SelectValue placeholder={loadingMarkets ? "Loading markets…" : "Select a market"} />
            </SelectTrigger>
            <SelectContent>
              {markets.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Pay sellers after an event via Stripe Connect transfers. Amounts are net of the 10% platform fee on item sales.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
      )}
      {message && (
        <div className="rounded-md bg-brand-accent/20 p-3 text-sm text-foreground">{message}</div>
      )}

      {marketId && (
        <div className="rounded-2xl border border-border/70 overflow-hidden">
          {loadingSellers ? (
            <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading balances…
            </div>
          ) : sellers.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No outstanding seller balances for this market.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {sellers.map((seller) => (
                <li
                  key={seller.sellerId}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{seller.name}</p>
                    <p className="text-sm text-muted-foreground">{seller.email}</p>
                    {!seller.stripeReady && (
                      <p className="text-xs text-amber-700 mt-1">
                        Stripe payouts not enabled — seller must finish Connect onboarding.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold tabular-nums">
                      CHF {seller.amountOwed.toFixed(2)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!seller.stripeReady || payingId === seller.sellerId}
                      onClick={() => paySeller(seller)}
                      className="bg-brand-accent text-foreground hover:bg-brand-accent/90"
                    >
                      {payingId === seller.sellerId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Transferring…
                        </>
                      ) : (
                        "Pay via Stripe"
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}