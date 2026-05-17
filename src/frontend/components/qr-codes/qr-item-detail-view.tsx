"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  Leaf,
  Share2,
  Store,
} from "lucide-react";
import { ItemDetailHero } from "@/components/items/item-detail-hero";
import { QRAddToCartButton } from "@/components/items/qr-add-to-cart-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  estimateCo2SavedKg,
  formatChfPrice,
  formatMarketDate,
  getConditionTagLabel,
  getGenderShortLabel,
  getSellerDisplayName,
  getSellerInitials,
  isGreatCondition,
  unwrapRelation,
} from "@/lib/qr/item-detail-helpers";
import type { ItemCategory, ItemCondition, Gender, ItemStatus } from "@/types/items";
import { getQRCodeBaseURL } from "@/lib/qr/generation";

export interface QrSimilarItem {
  id: string;
  title: string;
  selling_price: number | null;
  thumbnail_url: string;
  qrCode: string;
}

export interface QrItemDetailViewProps {
  qrCode: string;
  item: {
    id: string;
    title: string;
    description: string | null;
    selling_price: number | null;
    image_urls: string[];
    thumbnail_url: string;
    status: ItemStatus;
    category: ItemCategory;
    gender: Gender;
    condition: ItemCondition;
    brand?: { name: string } | { name: string }[] | null;
    size?: { name: string } | { name: string }[] | null;
    owner?: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      iban_verified_at?: string | null;
    } | {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      iban_verified_at?: string | null;
    }[] | null;
  };
  market: {
    id: string;
    name: string;
    start_date?: string | null;
  } | null;
  similarItems: QrSimilarItem[];
  sellerRackCount: number | null;
}

const OVERLAY_CONTROL_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white text-foreground shadow-md transition-colors hover:bg-white/90";

function DetailTag({
  children,
  variant = "muted",
}: {
  children: React.ReactNode;
  variant?: "muted" | "accent" | "lavender";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variant === "accent" && "bg-brand-accent/25 text-foreground",
        variant === "lavender" && "bg-brand-lavender/35 text-primary",
        variant === "muted" && "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

function SimilarItemCard({ item }: { item: QrSimilarItem }) {
  const price = formatChfPrice(item.selling_price);

  return (
    <Link
      href={`/qr/${encodeURIComponent(item.qrCode)}`}
      className="group block w-[140px] shrink-0 snap-start"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm">
        <Image
          src={item.thumbnail_url}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="140px"
        />
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
        {item.title}
      </p>
      {price && <p className="mt-0.5 text-sm font-bold text-primary">{price}</p>}
    </Link>
  );
}

export function QrItemDetailView({
  qrCode,
  item,
  market,
  similarItems,
  sellerRackCount,
}: QrItemDetailViewProps) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);

  const brand = unwrapRelation(item.brand);
  const size = unwrapRelation(item.size);
  const owner = unwrapRelation(item.owner);

  const images =
    item.image_urls?.length > 0
      ? item.image_urls
      : [item.thumbnail_url].filter(Boolean);

  const priceLabel = formatChfPrice(item.selling_price);
  const conditionTag = getConditionTagLabel(item.condition);
  const co2Kg = estimateCo2SavedKg(item.category);
  const sellerName = getSellerDisplayName(owner?.first_name, owner?.last_name);
  const sellerInitials = getSellerInitials(owner?.first_name, owner?.last_name);
  const isVerifiedSeller = Boolean(owner?.iban_verified_at);
  const marketDateLabel = formatMarketDate(market?.start_date);
  const sellerStatsLine = useMemo(() => {
    const parts: string[] = [];
    if (isVerifiedSeller) parts.push("Verified seller");
    if (sellerRackCount != null && sellerRackCount > 0) {
      parts.push(`${sellerRackCount} item${sellerRackCount === 1 ? "" : "s"} at market`);
    }
    return parts.length > 0 ? parts.join(" · ") : "Community seller";
  }, [isVerifiedSeller, sellerRackCount]);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/qr/scan");
  }, [router]);

  const handleShare = useCallback(async () => {
    const url = `${getQRCodeBaseURL()}/qr/${encodeURIComponent(qrCode)}`;
    const shareData = {
      title: item.title,
      text: `Check out ${item.title} on Bloem`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // fall through
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  }, [item.title, qrCode]);

  return (
    <div className="relative min-h-[100dvh] bg-background pb-28">
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 mx-auto flex max-w-lg items-start justify-between px-4 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className={`pointer-events-auto ${OVERLAY_CONTROL_CLASS}`}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWishlisted((value) => !value)}
              className={OVERLAY_CONTROL_CLASS}
              aria-label={wishlisted ? "Remove from saved" : "Save item"}
              aria-pressed={wishlisted}
            >
              <Heart
                className={cn("h-5 w-5", wishlisted && "fill-primary text-primary")}
              />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className={OVERLAY_CONTROL_CLASS}
              aria-label="Share item"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <ItemDetailHero images={images} title={item.title} hideControls />
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-5">
        <header>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
            {item.title}
          </h1>

          {priceLabel && (
            <p className="mt-2 text-2xl font-bold tabular-nums text-primary">{priceLabel}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <DetailTag variant="muted">Pre-loved</DetailTag>
            {conditionTag && (
              <DetailTag variant={isGreatCondition(item.condition) ? "accent" : "muted"}>
                {conditionTag}
              </DetailTag>
            )}
            {size?.name && <DetailTag variant="lavender">{size.name}</DetailTag>}
            <DetailTag variant="lavender">{getGenderShortLabel(item.gender)}</DetailTag>
            {brand?.name && <DetailTag variant="muted">{brand.name}</DetailTag>}
          </div>
        </header>

        {owner && (
          <section className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <Avatar className="h-12 w-12 shrink-0">
              {owner.avatar_url ? (
                <AvatarImage src={owner.avatar_url} alt={sellerName} />
              ) : null}
              <AvatarFallback className="bg-brand-lavender/30 text-sm font-bold text-primary">
                {sellerInitials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-foreground">{sellerName}</p>
              <p className="text-sm text-muted-foreground">{sellerStatsLine}</p>
            </div>

            {owner.id && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full border-border/80 px-4 font-semibold"
              >
                <Link href={`/wardrobe/user/${owner.id}`}>View</Link>
              </Button>
            )}
          </section>
        )}

        {market && (
          <section>
            <Link
              href={`/markets/${market.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:bg-muted/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-lavender/30 text-primary">
                <Store className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">From</p>
                <p className="truncate text-base font-bold text-foreground">{market.name}</p>
                {marketDateLabel && (
                  <p className="text-sm text-muted-foreground">{marketDateLabel}</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </section>
        )}

        <section
          className="flex gap-3 rounded-2xl border border-brand-accent/30 bg-brand-accent/15 p-4"
          aria-label="Environmental impact"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-accent/30 text-primary">
            <Leaf className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">Sustainable choice</p>
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
              You saved about {co2Kg.toFixed(1)} kg CO₂ by choosing pre-loved.
            </p>
          </div>
        </section>

        {item.description && (
          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <h2 className="text-sm font-bold text-foreground">About this item</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </section>
        )}

        {similarItems.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground">Similar items</h2>
              {market && (
                <Link
                  href={`/markets/${market.id}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  See all
                </Link>
              )}
            </div>

            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory scrollbar-none">
              {similarItems.map((similar) => (
                <SimilarItemCard key={similar.id} item={similar} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <QRAddToCartButton
            itemId={item.id}
            itemStatus={item.status}
            itemTitle={item.title}
            priceLabel={priceLabel}
            layout="sticky"
          />
        </div>
      </div>
    </div>
  );
}
