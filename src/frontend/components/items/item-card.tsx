import Link from "next/link";
import Image from "next/image";
import type { Item } from "@/types/items";
import { StatusBadge } from "./status-badge";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/wardrobe/${item.id}`} className="group">
      <div className="rounded-2xl border bg-card overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-102">
        {/* Image */}
        <div className="aspect-square relative bg-muted">
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <StatusBadge status={item.status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-base truncate mb-1">{item.title}</h3>

          {item.brand && (
            <p className="text-sm text-muted-foreground truncate mb-2">{item.brand}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <span className="capitalize">{item.category.toLowerCase()}</span>
              {item.size && <span> • {item.size}</span>}
            </div>

            {item.selling_price && (
              <p className="font-bold text-primary">€{item.selling_price.toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

