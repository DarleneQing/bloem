"use client";

import Image from "next/image";
import {
  CheckCircle,
  Eye,
  MoreHorizontal,
  Package,
  Store,
  Trash2,
} from "lucide-react";
import { ITEM_CATEGORIES, type ItemStatus } from "@/types/items";
import { cn } from "@/lib/utils";

export interface AdminItemListItem {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  selling_price: number | null;
  status: ItemStatus;
  thumbnail_url: string;
  created_at: string;
  market?: {
    name: string;
  } | null;
  owner: {
    first_name: string;
    last_name: string;
  };
}

interface AdminItemListCardProps {
  item: AdminItemListItem;
  isUpdating: boolean;
  isMoreOpen: boolean;
  onView: () => void;
  onMoveToRack: () => void;
  onMoveToWardrobe: () => void;
  onMarkSold: () => void;
  onDelete: () => void;
  onMoreToggle: () => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  return `CHF ${price.toFixed(0)}`;
}

function getStatusBadge(status: ItemStatus): { label: string; className: string } {
  switch (status) {
    case "RACK":
      return { label: "On rack", className: "bg-emerald-100 text-emerald-800" };
    case "SOLD":
      return { label: "Sold", className: "bg-brand-lavender/40 text-brand-purple" };
    case "RESERVED":
      return { label: "Reserved", className: "bg-amber-100 text-amber-800" };
    case "WARDROBE":
    default:
      return { label: "Wardrobe", className: "bg-orange-100 text-orange-800" };
  }
}

function getLinkedLabel(item: AdminItemListItem): string {
  if (item.status === "SOLD") {
    return "Sold item";
  }
  if (item.market?.name) {
    return `Market: ${item.market.name}`;
  }
  const categoryLabel =
    ITEM_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category;
  return `Owner: ${item.owner.first_name} ${item.owner.last_name} · ${categoryLabel}`;
}

export function AdminItemListCard({
  item,
  isUpdating,
  isMoreOpen,
  onView,
  onMoveToRack,
  onMoveToWardrobe,
  onMarkSold,
  onDelete,
  onMoreToggle,
}: AdminItemListCardProps) {
  const badge = getStatusBadge(item.status);
  const showMoveToRack = item.status === "WARDROBE";
  const showMoveToWardrobe = item.status === "RACK" || item.status === "RESERVED";
  const showMarkSold = item.status !== "SOLD";

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex gap-3 p-4">
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-brand-purple/10">
          {item.thumbnail_url ? (
            <Image
              src={item.thumbnail_url}
              alt=""
              fill
              sizes="72px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-8 w-8 text-brand-purple/70" aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
              {item.title}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                badge.className
              )}
            >
              {badge.label}
            </span>
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground">{getLinkedLabel(item)}</p>

          <p className="text-xs text-muted-foreground">Created {formatDate(item.created_at)}</p>

          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="min-w-0 text-sm text-muted-foreground">
              <span className="font-medium">Price</span>{" "}
              <span className="text-xs font-semibold text-foreground">
                {formatPrice(item.selling_price)}
              </span>
            </p>
            {item.brand ? (
              <p className="max-w-[40%] truncate text-right text-xs text-muted-foreground">
                {item.brand}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex border-t border-border/70">
        <button
          type="button"
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <Eye className="h-4 w-4" aria-hidden />
          View
        </button>

        <div className="w-px bg-border/70" aria-hidden />

        {showMoveToRack ? (
          <>
            <button
              type="button"
              onClick={onMoveToRack}
              disabled={isUpdating}
              className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-brand-purple transition-colors hover:bg-brand-lavender/20 disabled:opacity-50"
            >
              <Store className="h-4 w-4" aria-hidden />
              {isUpdating ? "…" : "List"}
            </button>
            <div className="w-px bg-border/70" aria-hidden />
          </>
        ) : null}

        {showMoveToWardrobe ? (
          <>
            <button
              type="button"
              onClick={onMoveToWardrobe}
              disabled={isUpdating}
              className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
            >
              <Package className="h-4 w-4" aria-hidden />
              {isUpdating ? "…" : "Wardrobe"}
            </button>
            <div className="w-px bg-border/70" aria-hidden />
          </>
        ) : null}

        {showMarkSold ? (
          <>
            <button
              type="button"
              onClick={onMarkSold}
              disabled={isUpdating}
              className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" aria-hidden />
              {isUpdating ? "…" : "Sold"}
            </button>
            <div className="w-px bg-border/70" aria-hidden />
          </>
        ) : null}

        <div className="relative flex flex-1">
          <button
            type="button"
            onClick={onMoreToggle}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-expanded={isMoreOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>

          {isMoreOpen ? (
            <div
              data-dropdown-id={item.id}
              className="absolute bottom-full right-2 z-50 mb-1 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onView}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/60"
              >
                <Eye className="h-4 w-4" />
                View details
              </button>
              {item.status !== "WARDROBE" ? (
                <button
                  type="button"
                  onClick={onMoveToWardrobe}
                  disabled={isUpdating}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted/60 disabled:opacity-50"
                >
                  <Package className="h-4 w-4" />
                  Move to wardrobe
                </button>
              ) : null}
              {item.status !== "RACK" ? (
                <button
                  type="button"
                  onClick={onMoveToRack}
                  disabled={isUpdating}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-brand-purple hover:bg-brand-lavender/20 disabled:opacity-50"
                >
                  <Store className="h-4 w-4" />
                  Move to rack
                </button>
              ) : null}
              {item.status !== "SOLD" ? (
                <button
                  type="button"
                  onClick={onMarkSold}
                  disabled={isUpdating}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Mark as sold
                </button>
              ) : null}
              <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete item
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
