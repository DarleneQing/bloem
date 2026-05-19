"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Copy,
  Package,
  Search,
  Store,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PurchaseTransaction } from "@/features/profile/queries";
import { useCallback, useMemo, useState } from "react";

interface PurchaseHistoryViewProps {
  transactions: PurchaseTransaction[];
}

function formatChf(amount: number) {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function shortenId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

const PAYMENT_STATUS_STYLE: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: "Completed", className: "bg-brand-accent/15 text-brand-accent border-brand-accent/30" },
  PENDING: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  FAILED: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/30" },
  REFUNDED: { label: "Refunded", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

function deriveFulfillmentStatus(tx: PurchaseTransaction): "succeeded" | "cancelled" {
  if (tx.status === "FAILED" || tx.status === "REFUNDED") return "cancelled";
  return "succeeded";
}

const FULFILLMENT_STYLE: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  succeeded: { label: "Succeeded", icon: CheckCircle2, className: "text-brand-accent" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "text-destructive" },
};

function PaymentStatusBadge({ status }: { status: string }) {
  const style = PAYMENT_STATUS_STYLE[status] ?? PAYMENT_STATUS_STYLE.PENDING;
  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium", style.className)}>
      {style.label}
    </Badge>
  );
}

function CopyableOrderId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const shortId = shortenId(id);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [id]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      title="Copy full order ID"
    >
      <span className="font-mono">#{shortId}</span>
      {copied ? (
        <CheckCircle2 className="h-3 w-3 text-brand-accent" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{children}</span>
    </div>
  );
}

function TransactionCard({ tx }: { tx: PurchaseTransaction }) {
  const [expanded, setExpanded] = useState(false);

  const sellerName = tx.seller
    ? `${tx.seller.first_name} ${tx.seller.last_name}`.trim()
    : "Unknown seller";
  const sellerInitials = tx.seller
    ? `${tx.seller.first_name.charAt(0)}${tx.seller.last_name.charAt(0)}`
    : "?";

  const fulfillment = deriveFulfillmentStatus(tx);
  const FulfillmentIcon = FULFILLMENT_STYLE[fulfillment].icon;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <button
        type="button"
        className="flex w-full gap-3 p-4 text-left transition-colors hover:bg-muted/30"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        {tx.item?.thumbnail_url ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image
              src={tx.item.thumbnail_url}
              alt={tx.item.title ?? "Item"}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {tx.item?.title ?? "Item"}
            </h3>
            <PaymentStatusBadge status={tx.status} />
          </div>

          <p className="mt-0.5 text-base font-bold text-primary">{formatChf(tx.total_amount)}</p>

          <div className="mt-0.5 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{formatDate(tx.created_at)}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/60 px-4 py-3">
            <div className="divide-y divide-border/40">
              <DetailRow label="Order ID">
                <CopyableOrderId id={tx.id} />
              </DetailRow>
              <DetailRow label="Order placed">{formatDate(tx.created_at)}</DetailRow>
              <DetailRow label="Payment status">
                <PaymentStatusBadge status={tx.status} />
              </DetailRow>
              <DetailRow label="Fulfillment">
                <span className={cn("flex items-center gap-1", FULFILLMENT_STYLE[fulfillment].className)}>
                  <FulfillmentIcon className="h-3.5 w-3.5" />
                  {FULFILLMENT_STYLE[fulfillment].label}
                </span>
              </DetailRow>
              <DetailRow label="Item total">{formatChf(tx.total_amount)}</DetailRow>
              {tx.platform_fee > 0 && (
                <DetailRow label="Platform fee">{formatChf(tx.platform_fee)}</DetailRow>
              )}
            </div>
          </div>

          <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  {tx.seller?.avatar_url ? (
                    <AvatarImage src={tx.seller.avatar_url} alt={sellerName} />
                  ) : null}
                  <AvatarFallback className="bg-secondary/30 text-[10px] font-bold text-primary">
                    {sellerInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  from <span className="font-medium text-foreground">{sellerName}</span>
                </span>
              </div>

              {tx.market && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Store className="h-3 w-3" />
                  <span>{tx.market.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function matchesSearch(tx: PurchaseTransaction, query: string): boolean {
  const q = query.toLowerCase();
  if (tx.item?.title?.toLowerCase().includes(q)) return true;
  if (tx.id.toLowerCase().includes(q)) return true;
  if (tx.seller) {
    const name = `${tx.seller.first_name} ${tx.seller.last_name}`.toLowerCase();
    if (name.includes(q)) return true;
  }
  if (tx.market?.name?.toLowerCase().includes(q)) return true;
  if (tx.status.toLowerCase().includes(q)) return true;
  return false;
}

export function PurchaseHistoryView({ transactions }: PurchaseHistoryViewProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    return transactions.filter((tx) => matchesSearch(tx, search.trim()));
  }, [transactions, search]);

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6 md:pb-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/profile"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-primary transition-colors hover:bg-secondary/30"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Purchase History</h1>
      </div>

      {transactions.length > 0 && (
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by item, seller, market, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border/60 pl-9 text-sm"
          />
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-16 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No purchases yet</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Items you buy at pop-up markets will appear here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-12 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No results found</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Try a different search term.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => (
            <TransactionCard key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
