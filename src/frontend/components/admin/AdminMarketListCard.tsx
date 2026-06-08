"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Pencil,
  ClipboardList,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  Pause,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMarketScheduleDisplay } from "@/lib/markets/schedule-format";

export interface AdminMarketListItem {
  id: string;
  name: string;
  picture?: string;
  location: {
    name: string;
    address: string;
  };
  dates: {
    start: string;
    end: string;
  };
  hours?: {
    opening: string | null;
    closing: string | null;
  };
  capacity: {
    currentVendors: number;
    maxVendors: number;
  };
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export type MarketDisplayPhase = "draft" | "upcoming" | "active" | "past";

interface AdminMarketListCardProps {
  market: AdminMarketListItem;
  displayPhase: MarketDisplayPhase;
  isUpdating: boolean;
  isMoreOpen: boolean;
  onEdit: () => void;
  onApprove: () => void;
  onMoreToggle: () => void;
  onView: () => void;
  onDeactivate: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

function formatMarketScheduleLine(market: AdminMarketListItem): string {
  return formatMarketScheduleDisplay({
    start: market.dates.start,
    end: market.dates.end,
    opening: market.hours?.opening,
    closing: market.hours?.closing,
  });
}

function formatLocation(market: AdminMarketListItem): string {
  const name = market.location.name?.trim();
  const address = market.location.address?.trim();
  if (name && address && !address.startsWith(name)) {
    return `${name}, ${address}`;
  }
  return name || address || "Location TBA";
}

function getDisplayBadge(phase: MarketDisplayPhase): { label: string; className: string } {
  switch (phase) {
    case "active":
      return { label: "Active", className: "bg-brand-accent/15 text-foreground" };
    case "upcoming":
      return { label: "Upcoming", className: "bg-brand-lavender/40 text-brand-purple" };
    case "past":
      return { label: "Past", className: "bg-slate-100 text-slate-700" };
    case "draft":
    default:
      return { label: "Draft", className: "bg-gray-100 text-gray-700" };
  }
}

export function AdminMarketListCard({
  market,
  displayPhase,
  isUpdating,
  isMoreOpen,
  onEdit,
  onApprove,
  onMoreToggle,
  onView,
  onDeactivate,
  onCancel,
  onDelete,
}: AdminMarketListCardProps) {
  const badge = getDisplayBadge(displayPhase);
  const showApprove = market.status === "DRAFT";
  const showApplications = market.status !== "DRAFT";

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex gap-3 p-4">
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image
            src={market.picture || "/assets/images/brand-transparent.png"}
            alt=""
            fill
            sizes="72px"
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
              {market.name}
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

          <p className="text-sm text-muted-foreground">
            {formatMarketScheduleLine(market)}
          </p>

          <p className="flex items-start gap-1 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="line-clamp-2">{formatLocation(market)}</span>
          </p>

          <div className="pt-1">
            <p className="text-xs font-medium text-muted-foreground">Vendors</p>
            <p className="text-2xl font-bold leading-none text-foreground">
              {market.capacity.currentVendors}
            </p>
          </div>
        </div>
      </div>

      <div className="flex border-t border-border/70">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Edit
        </button>

        <div className="w-px bg-border/70" aria-hidden />

        {showApplications ? (
          <Link
            href={`/admin/markets/${market.id}/applications`}
            className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-brand-purple transition-colors hover:bg-brand-lavender/20"
          >
            <ClipboardList className="h-4 w-4" aria-hidden />
            Application
          </Link>
        ) : null}

        <div className="w-px bg-border/70" aria-hidden />

        {showApprove ? (
          <>
            <button
              type="button"
              onClick={onApprove}
              disabled={isUpdating}
              className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-brand-purple transition-colors hover:bg-brand-lavender/20 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {isUpdating ? "…" : "Activate"}
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
            More
          </button>

          {isMoreOpen ? (
            <div
              data-dropdown-id={market.id}
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

              {market.status === "ACTIVE" ? (
                <>
                  <button
                    type="button"
                    onClick={onDeactivate}
                    disabled={isUpdating}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                  >
                    <Pause className="h-4 w-4" />
                    Deactivate
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isUpdating}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel market
                  </button>
                </>
              ) : null}

              {market.status === "DRAFT" || market.status === "CANCELLED" ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
