import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { DiscoverableRackItem } from "@/features/items/queries";
import { formatChfPrice } from "@/lib/qr/item-detail-helpers";

interface HomePopularItemCardProps {
  item: DiscoverableRackItem;
}

export function HomePopularItemCard({ item }: HomePopularItemCardProps) {
  const priceLabel = formatChfPrice(item.selling_price);

  return (
    <Link
      href={`/qr/${encodeURIComponent(item.qrCode)}`}
      className="group block w-[148px] shrink-0 sm:w-[160px]"
    >
      <article className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50 transition-shadow group-hover:shadow-md">
        <div className="relative aspect-[4/5] bg-muted">
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="160px"
          />
          <span
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card/95 text-muted-foreground shadow-sm"
            aria-hidden
          >
            <Heart className="h-4 w-4" />
          </span>
        </div>
        <div className="px-3 py-2.5">
          <h3 className="truncate text-sm font-semibold text-foreground">{item.title}</h3>
          {priceLabel && (
            <p className="mt-1 text-sm font-bold text-foreground">{priceLabel}</p>
          )}
        </div>
      </article>
    </Link>
  );
}
