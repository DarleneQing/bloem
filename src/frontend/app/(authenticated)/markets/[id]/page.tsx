"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPreview } from "@/components/admin/MapPreview";
import { MarketDetailHero } from "@/components/markets/market-detail-hero";
import {
  enrollmentVariant,
  MarketApplyAsSeller,
} from "@/components/markets/market-apply-as-seller";
import {
  isApprovedEnrollment,
  type MarketEnrollmentState,
} from "@/lib/markets/enrollment-status";
import { MarketFeaturedVendors } from "@/components/markets/market-featured-vendors";
import HangerRentalForm from "@/components/markets/HangerRentalForm";
import { getMarketCapacity } from "@/features/markets/queries";
import { unregisterForMarket } from "@/features/markets/actions";
import { getMyHangerRentals } from "@/features/hanger-rentals/queries";
import { MarketCapacityResult, MarketDetail } from "@/types/markets";
import { CalendarCheck2, MapPin, Shirt, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatMarketScheduleDisplay } from "@/lib/markets/schedule-format";
  const name = market.location.name?.trim();
  const address = market.location.address?.trim();
  if (name && address) return `${name}, ${address}`;
  return name || address || "Location TBA";
}

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [market, setMarket] = useState<MarketDetail | null>(null);
  const [capacity, setCapacity] = useState<MarketCapacityResult | null>(null);
  const [rackItemCount, setRackItemCount] = useState<number | null>(null);
  const [enrollment, setEnrollment] = useState<MarketEnrollmentState | null>(null);
  const [pendingRentalId, setPendingRentalId] = useState<string | null>(null);
  const [hasConfirmedRental, setHasConfirmedRental] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [featuredVendorsRefreshKey, setFeaturedVendorsRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const [listRes, cap, enrollmentRes, myRentals] = await Promise.all([
          fetch(`/api/markets?status=ACTIVE&limit=50&sortBy=start_date&sortOrder=asc`, {
            cache: "no-store",
          })
            .then((r) => r.json())
            .catch(() => ({ data: { markets: [] } })),
          getMarketCapacity(id),
          fetch(`/api/markets/${id}/enrollment`, { cache: "no-store" })
            .then((r) => r.json())
            .catch(() => ({ data: { isRegistered: false, enrollment: null } })),
          getMyHangerRentals().catch(() => []),
        ]);

        const found =
          (listRes?.data?.markets ?? []).find((m: MarketDetail) => m.id === id) ?? null;

        if (!active) return;

        setMarket(found);
        setCapacity(cap);
        setEnrollment(enrollmentRes?.data?.enrollment ?? null);

        const pending = Array.isArray(myRentals)
          ? myRentals.find((r: { market_id: string; status: string }) => r.market_id === id && r.status === "PENDING")
          : null;
        const confirmed = Array.isArray(myRentals)
          ? myRentals.some((r: { market_id: string; status: string }) => r.market_id === id && r.status === "CONFIRMED")
          : false;
        setPendingRentalId(pending ? pending.id : null);
        setHasConfirmedRental(Boolean(confirmed));

        const supabase = createClient();
        const { count } = await supabase
          .from("items")
          .select("id", { count: "exact", head: true })
          .eq("market_id", id)
          .eq("status", "RACK");

        if (active) {
          setRackItemCount(count ?? 0);
        }
      } catch {
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

  const full = capacity
    ? capacity.vendors.available === 0 || capacity.hangers.available === 0
    : false;

  const stats = useMemo(() => {
    if (!capacity) return null;
    return [
      {
        label: "Vendors",
        value: String(capacity.vendors.current),
        icon: Users,
      },
      {
        label: "On the rack",
        value: rackItemCount === null ? "—" : rackItemCount > 0 ? `${rackItemCount}+` : "0",
        icon: Shirt,
      },
      {
        label: "Spots left",
        value: String(capacity.vendors.available),
        icon: CalendarCheck2,
      },
    ];
  }, [capacity, rackItemCount]);

  const onUnregister = () => {
    startTransition(async () => {
      if (pendingRentalId) {
        try {
          await fetch(`/api/hanger-rentals/${pendingRentalId}`, {
            method: "DELETE",
            cache: "no-store",
            credentials: "include",
          });
          setPendingRentalId(null);
        } catch {
          // continue deregister
        }
      }
      const res = await unregisterForMarket(id);
      if ((res as { error?: string }).error) {
        setError((res as { error: string }).error);
      } else {
        setEnrollment(null);
        try {
          const check = await fetch(`/api/markets/${id}/enrollment`, {
            cache: "no-store",
            credentials: "include",
          }).then((r) => r.json());
          setEnrollment(check?.data?.enrollment ?? null);
        } catch {
          // keep optimistic state
        }
        try {
          const cap = await getMarketCapacity(id);
          setCapacity(cap);
        } catch {
          // ignore
        }
        setFeaturedVendorsRefreshKey((k) => k + 1);
        router.refresh();
      }
    });
  };

  if (loading) {
    return <div className="px-4 py-10 text-center text-muted-foreground">Loading market…</div>;
  }

  if (!market) {
    return (
      <div className="px-4 py-10 text-center text-muted-foreground">
        This market is no longer available.
      </div>
    );
  }

  const enrollmentStatus = enrollment?.status ?? null;
  const isApproved = isApprovedEnrollment(enrollmentStatus);
  const applyVariant = enrollmentVariant(enrollmentStatus);

  return (
    <div className="pb-28 md:pb-10">
      <MarketDetailHero
        imageUrl={market.pictureUrl}
        alt={market.name}
        isFull={full}
      />

      <div className="relative z-10 -mt-2 rounded-t-3xl bg-background px-4 pt-10 md:mx-auto md:max-w-3xl md:px-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
            {market.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatMarketScheduleDisplay({
              start: market.dates.start,
              end: market.dates.end,
              opening: market.hours?.opening,
              closing: market.hours?.closing,
            })}
          </p>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{formatLocationLine(market)}</span>
          </p>
        </div>

        {stats && (
          <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border/70 bg-card py-3 shadow-sm sm:py-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex min-w-0 items-center gap-2 px-2 sm:gap-2.5 sm:px-3"
                >
                  <Icon className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-none text-primary sm:text-xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[10px] leading-tight text-muted-foreground sm:text-xs">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {market.description && (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{market.description}</p>
        )}

        <div className="mt-8">
          <MarketFeaturedVendors marketId={id} refreshKey={featuredVendorsRefreshKey} />
        </div>

        <MarketApplyAsSeller
          className="mt-8"
          marketId={id}
          variant={applyVariant}
          submittedAt={enrollment?.submittedAt}
          approvedAt={enrollment?.approvedAt}
          disabled={full}
          applyLabel={full ? "Market full" : "Apply to Become a Seller"}
        />

        {isApproved && (
          <Card className="mt-8 overflow-hidden rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3 sm:p-5 sm:pb-4">
              <h2 className="text-lg font-bold text-foreground">Hanger rental</h2>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.alert(
                      "Reserve hangers after registering. Pending rentals auto-cancel after 24 hours if payment is not completed."
                    );
                  }
                }}
              >
                How it works
              </button>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
              <HangerRentalForm
              marketId={id}
              hangerPrice={market.pricing.hangerPrice}
              capacity={{ availableHangers: capacity?.hangers.available ?? 0 }}
              limits={{
                unlimited: Boolean(
                  (market as MarketDetail & { policy?: { unlimitedHangersPerSeller?: boolean } }).policy
                    ?.unlimitedHangersPerSeller ??
                    (market as { unlimited_hangers_per_seller?: boolean }).unlimited_hangers_per_seller ??
                    false
                ),
                maxPerSeller: Number(
                  (market as MarketDetail & { policy?: { maxHangersPerSeller?: number } }).policy
                    ?.maxHangersPerSeller ??
                    (market as { max_hangers_per_seller?: number }).max_hangers_per_seller ??
                    5
                ),
              }}
              variant="compact"
              onChange={async () => {
                try {
                  const cap = await getMarketCapacity(id);
                  setCapacity(cap);
                } catch {
                  // ignore
                }
              }}
            />

            {!hasConfirmedRental && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full rounded-full">
                    Deregister from market
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deregister from market?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes your registration for this market. Any pending hanger rentals will be
                      cancelled.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                      <Button variant="outline" className="rounded-full">
                        Back
                      </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button variant="destructive" onClick={onUnregister} disabled={isPending}>
                        {isPending ? "Deregistering…" : "Confirm deregister"}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              )}
            </CardContent>
          </Card>
        )}

        {market.location.address && (
          <section className="mt-8 space-y-3">
            <h2 className="text-lg font-bold text-foreground">Location</h2>
            <div className="text-sm text-muted-foreground">
              {market.location.name && (
                <p>
                  <span className="font-medium text-foreground">Name:</span> {market.location.name}
                </p>
              )}
              <p className={market.location.name ? "mt-1" : undefined}>
                <span className="font-medium text-foreground">Address:</span> {market.location.address}
              </p>
            </div>
            <MapPreview
              address={market.location.address}
              locationName={market.location.name}
              height="320px"
            />
          </section>
        )}

        {error && (
          <p className="mt-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
      </div>

    </div>
  );
}
