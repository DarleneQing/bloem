import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketSummary } from "@/types/markets";

interface Props {
  market: MarketSummary;
}

export function MarketCard({ market }: Props) {
  const full = market.capacity.availableSpots === 0 || market.capacity.availableHangers === 0;

  const startDate = new Date(market.dates.start);
  const endDate = new Date(market.dates.end);

  return (
    <Link href={`/markets/${market.id}`} className="block">
      <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        <div className="aspect-video relative bg-secondary/10 overflow-hidden rounded-t-lg">
          <Image
            src={market.pictureUrl || "/assets/images/brand-transparent.png"}
            alt={market.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {full && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-base">Market Full</Badge>
            </div>
          )}
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl font-bold line-clamp-2 flex-1">{market.name}</CardTitle>
            {full ? (
              <Badge variant="destructive">Full</Badge>
            ) : (
              <Badge variant="secondary">Open</Badge>
            )}
          </div>
          {market.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{market.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1">{market.location.name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Vendors: {market.capacity.currentVendors}/{market.capacity.maxVendors}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Hangers: {market.capacity.currentHangers}/{market.capacity.maxHangers}
            </Badge>
          </div>
          {/* Price information - only relevant for sellers considering registration */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rental fee</span>
              <span className="font-bold text-primary">CHF {Number(market.pricing.hangerPrice).toFixed(2)}/hanger</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
