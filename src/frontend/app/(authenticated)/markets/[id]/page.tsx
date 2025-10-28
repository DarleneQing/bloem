"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMarketCapacity } from "@/features/markets/queries";
import { registerForMarket, unregisterForMarket } from "@/features/markets/actions";
import { MarketCapacityResult, MarketDetail } from "@/types/markets";
import { MapPreview } from "@/components/admin/MapPreview";
import Image from "next/image";

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [capacity, setCapacity] = useState<MarketCapacityResult | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const [listRes, cap, enrollmentRes] = await Promise.all([
          fetch(`/api/markets?status=all&limit=50&sortBy=start_date&sortOrder=asc`, { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => ({ data: { markets: [] } })),
          getMarketCapacity(id),
          fetch(`/api/markets/${id}/enrollment`, { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => ({ data: { isRegistered: false } })),
        ]);
        const found = (listRes?.data?.markets ?? []).find((m: any) => m.id === id) ?? null;
        if (active) {
          setMarket(found);
          setCapacity(cap);
          setIsRegistered(enrollmentRes?.data?.isRegistered || false);
        }
      } catch (_e) {
        if (active) setError("Failed to load market");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      active = false;
    };
  }, [id]);

  const full = capacity ? capacity.vendors.available === 0 || capacity.hangers.available === 0 : false;

  const onRegister = () => {
    startTransition(async () => {
      const res = await registerForMarket(id);
      if ((res as any).error) {
        setError((res as any).error);
      } else {
        setIsRegistered(true);
        const cap = await getMarketCapacity(id);
        setCapacity(cap);
        router.refresh();
      }
    });
  };

  const onUnregister = () => {
    startTransition(async () => {
      const res = await unregisterForMarket(id);
      if ((res as any).error) {
        setError((res as any).error);
      } else {
        setIsRegistered(false);
        const cap = await getMarketCapacity(id);
        setCapacity(cap);
        router.refresh();
      }
    });
  };

  if (loading) return <div className="container py-6">Loading...</div>;
  if (!market) return <div className="container py-6">Market not found</div>;

  const startDate = new Date(market.dates.start);
  const endDate = new Date(market.dates.end);

  return (
    <div className="container py-6 md:py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/markets">← Back to Markets</Link>
        </Button>
      </div>

      {/* Header image and title */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-secondary/20">
            <Image
              src={(market as any).pictureUrl || "/assets/images/brand-transparent.png"}
              alt={market.name}
              fill
              className="object-cover"
              priority
            />
            {full && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Badge variant="destructive" className="text-base">Market Full</Badge>
              </div>
            )}
          </div>

          <div className="mt-4 md:mt-6 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black text-primary">{market.name}</h1>
              {full ? (
                <Badge variant="destructive">Full</Badge>
              ) : (
                <Badge variant="secondary">Open</Badge>
              )}
            </div>
            {market.description && (
              <p className="text-muted-foreground leading-relaxed">{market.description}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1">{market.location.name} • {market.location.address}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>
                  {startDate.toLocaleString()} – {endDate.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Location Map */}
            {market.location.address && (
              <div className="mt-6 space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </h3>
                <div className="text-sm text-muted-foreground">
                  <p><span className="font-medium">Name:</span> {market.location.name || "N/A"}</p>
                  <p className="mt-1"><span className="font-medium">Address:</span> {market.location.address}</p>
                </div>
                <MapPreview 
                  address={market.location.address}
                  locationName={market.location.name}
                  height="400px"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border p-5 md:p-6 space-y-4 sticky top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Registration</h2>
              {isRegistered && <Badge variant="default" className="text-sm">Registered</Badge>}
            </div>
            {capacity && (
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">Vendors (occupied/max)</span>
                  <Badge variant="outline">{capacity.vendors.current}/{capacity.vendors.max}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">Hangers (occupied/max)</span>
                  <Badge variant="outline">{capacity.hangers.current}/{capacity.hangers.max}</Badge>
                </div>
              </div>
            )}

            {isRegistered ? (
              <Button onClick={onUnregister} disabled={isPending} variant="outline" className="w-full">
                Deregister
              </Button>
            ) : (
              <Button onClick={onRegister} disabled={isPending || full} className="w-full">
                {full ? "Market Full" : "Register as Seller"}
              </Button>
            )}

            {error && <div className="text-destructive text-sm">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}


