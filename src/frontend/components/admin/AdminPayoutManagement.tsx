"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  CheckCircle2,
  Eye,
  Filter,
  Flag,
  PauseCircle,
  RotateCcw,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PayoutStatus = "pending" | "paid" | "failed" | "on_hold";
type StatusFilter = "all" | PayoutStatus;
type SortOption = "newest" | "amount_high" | "amount_low" | "name";

interface PayoutRequest {
  id: string;
  sellerName: string;
  avatarUrl: string | null;
  verified: boolean;
  flagged: boolean;
  paymentMethod: "bank" | "paypal";
  paymentLabel: string;
  requestedAt: string;
  amount: number;
  status: PayoutStatus;
}

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "paid", label: "Paid" },
  { id: "failed", label: "Failed" },
  { id: "on_hold", label: "On Hold" },
];

const MOCK_PAYOUTS: PayoutRequest[] = [
  {
    id: "1",
    sellerName: "Maya Johnson",
    avatarUrl: null,
    verified: true,
    flagged: false,
    paymentMethod: "bank",
    paymentLabel: "Bank •••• 0312",
    requestedAt: "2025-05-24",
    amount: 236.5,
    status: "pending",
  },
  {
    id: "2",
    sellerName: "Liam Carter",
    avatarUrl: null,
    verified: true,
    flagged: false,
    paymentMethod: "paypal",
    paymentLabel: "PayPal •••• liam.c@email.com",
    requestedAt: "2025-05-24",
    amount: 112.36,
    status: "pending",
  },
  {
    id: "3",
    sellerName: "Sofia Martinez",
    avatarUrl: null,
    verified: false,
    flagged: true,
    paymentMethod: "bank",
    paymentLabel: "Bank •••• 8841",
    requestedAt: "2025-05-23",
    amount: 85,
    status: "failed",
  },
  {
    id: "4",
    sellerName: "Noah Williams",
    avatarUrl: null,
    verified: true,
    flagged: false,
    paymentMethod: "bank",
    paymentLabel: "Bank •••• 2290",
    requestedAt: "2025-05-22",
    amount: 412.75,
    status: "paid",
  },
  {
    id: "5",
    sellerName: "Emma Dubois",
    avatarUrl: null,
    verified: true,
    flagged: false,
    paymentMethod: "paypal",
    paymentLabel: "PayPal •••• emma.d@email.com",
    requestedAt: "2025-05-21",
    amount: 178.2,
    status: "on_hold",
  },
  {
    id: "6",
    sellerName: "Lucas Berg",
    avatarUrl: null,
    verified: false,
    flagged: true,
    paymentMethod: "bank",
    paymentLabel: "Bank •••• 5517",
    requestedAt: "2025-05-20",
    amount: 64.99,
    status: "pending",
  },
];

const SUMMARY_STATS = {
  pendingTotal: 27640,
  pendingCount: 24,
  paidThisMonth: 86735,
  paidGrowthPercent: 8.7,
  failedTotal: 1256,
  failedCount: 5,
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatRequestedDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStatusBadge(status: PayoutStatus) {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        className: "bg-amber-50 text-amber-700",
      };
    case "paid":
      return {
        label: "Paid",
        className: "bg-brand-accent/10 text-foreground",
      };
    case "failed":
      return {
        label: "Failed",
        className: "bg-red-50 text-red-600",
      };
    case "on_hold":
      return {
        label: "On Hold",
        className: "bg-orange-50 text-orange-700",
      };
  }
}

interface PayoutCardProps {
  payout: PayoutRequest;
  onApprove: (id: string) => void;
  onHold: (id: string) => void;
  onReject: (id: string) => void;
  onRetry: (id: string) => void;
  onView: (id: string) => void;
}

function PayoutCard({
  payout,
  onApprove,
  onHold,
  onReject,
  onRetry,
  onView,
}: PayoutCardProps) {
  const badge = getStatusBadge(payout.status);
  const initials = getInitials(payout.sellerName);
  const isFailed = payout.status === "failed";

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-lavender/30">
          {payout.avatarUrl ? (
            <Image
              src={payout.avatarUrl}
              alt={payout.sellerName}
              fill
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand-purple">
              {initials}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-gray-900">
              {payout.sellerName}
            </h3>
            {payout.verified && (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-brand-accent"
                aria-label="Verified seller"
              />
            )}
            {payout.flagged && (
              <Flag
                className="h-4 w-4 shrink-0 text-amber-500"
                aria-label="Flagged payout"
              />
            )}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {payout.paymentLabel}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Requested: {formatRequestedDate(payout.requestedAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="text-base font-bold text-gray-900">
            {formatCurrency(payout.amount)}
          </p>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              badge.className
            )}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {isFailed ? (
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onRetry(payout.id)}
            className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-brand-purple transition-colors hover:bg-brand-purple/5"
          >
            <RotateCcw className="h-4 w-4" />
            Retry
          </button>
          <button
            type="button"
            onClick={() => onView(payout.id)}
            className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            View
          </button>
          <button
            type="button"
            onClick={() => onReject(payout.id)}
            className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      ) : payout.status === "pending" || payout.status === "on_hold" ? (
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onApprove(payout.id)}
            className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-brand-accent transition-colors hover:bg-brand-accent/10"
          >
            <Check className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => onHold(payout.id)}
            className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50"
          >
            <PauseCircle className="h-4 w-4" />
            Hold
          </button>
          <button
            type="button"
            onClick={() => onReject(payout.id)}
            className="flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={() => onView(payout.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            View details
          </button>
        </div>
      )}
    </article>
  );
}

function StatCard({
  value,
  label,
  sublabel,
  sublabelClassName,
}: {
  value: string;
  label: string;
  sublabel: ReactNode;
  sublabelClassName?: string;
}) {
  return (
    <div className="min-w-[9.5rem] shrink-0 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className={cn(
          "mt-1 text-xs",
          sublabelClassName ?? "text-muted-foreground"
        )}
      >
        {sublabel}
      </div>
    </div>
  );
}

export function AdminPayoutManagement() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterHint, setShowFilterHint] = useState(false);

  const filteredPayouts = useMemo(() => {
    let list =
      statusFilter === "all"
        ? MOCK_PAYOUTS
        : MOCK_PAYOUTS.filter((p) => p.status === statusFilter);

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "amount_high":
          return b.amount - a.amount;
        case "amount_low":
          return a.amount - b.amount;
        case "name":
          return a.sellerName.localeCompare(b.sellerName);
        case "newest":
        default:
          return (
            new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
          );
      }
    });

    return list;
  }, [statusFilter, sortBy]);

  const sortLabel =
    sortBy === "amount_high"
      ? "Amount (high)"
      : sortBy === "amount_low"
        ? "Amount (low)"
        : sortBy === "name"
          ? "Name"
          : "Newest";

  const handleAction = (action: string, id: string) => {
    void action;
    void id;
  };

  return (
    <div className="mx-auto w-full max-w-lg md:max-w-2xl">
      <header className="mb-4 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/admin" aria-label="Back to admin dashboard">
            <ArrowLeft className="h-5 w-5 text-brand-purple" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold text-brand-purple">
          Payout Management
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Filter payouts"
          onClick={() => setShowFilterHint((open) => !open)}
        >
          <Filter className="h-5 w-5 text-brand-purple" />
        </Button>
      </header>

      {showFilterHint && (
        <p className="mb-3 rounded-xl border border-brand-lavender/50 bg-brand-lavender/10 px-3 py-2 text-center text-xs text-brand-purple">
          Advanced filters will be available when payout data is connected.
        </p>
      )}

      <div className="mb-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StatCard
          value={formatCurrency(SUMMARY_STATS.pendingTotal)}
          label="Pending Payouts"
          sublabel={`${SUMMARY_STATS.pendingCount} requests`}
        />
        <StatCard
          value={formatCurrency(SUMMARY_STATS.paidThisMonth)}
          label="Paid This Month"
          sublabel={
            <span className="inline-flex items-center gap-0.5 font-medium text-brand-accent">
              <TrendingUp className="h-3 w-3" aria-hidden />
              +{SUMMARY_STATS.paidGrowthPercent}%
            </span>
          }
        />
        <StatCard
          value={formatCurrency(SUMMARY_STATS.failedTotal)}
          label="Failed Payouts"
          sublabel={`${SUMMARY_STATS.failedCount} requests`}
          sublabelClassName="text-red-600"
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatusFilter(filter.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === filter.id
                ? "bg-brand-purple text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-brand-lavender"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filteredPayouts.length} payout request
          {filteredPayouts.length === 1 ? "" : "s"}
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSortMenu((open) => !open)}
            className="flex items-center gap-1 text-sm font-medium text-brand-purple"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort
          </button>
          {showSortMenu && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                aria-label="Close sort menu"
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {(
                  [
                    { id: "newest", label: "Newest" },
                    { id: "amount_high", label: "Amount (high)" },
                    { id: "amount_low", label: "Amount (low)" },
                    { id: "name", label: "Name (A–Z)" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSortBy(option.id);
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      "block w-full px-4 py-2 text-left text-sm hover:bg-gray-50",
                      sortBy === option.id && "font-medium text-brand-purple"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="sr-only">Sorted by {sortLabel}</p>

      <div className="space-y-3">
        {filteredPayouts.map((payout) => (
          <PayoutCard
            key={payout.id}
            payout={payout}
            onApprove={(id) => handleAction("approve", id)}
            onHold={(id) => handleAction("hold", id)}
            onReject={(id) => handleAction("reject", id)}
            onRetry={(id) => handleAction("retry", id)}
            onView={(id) => handleAction("view", id)}
          />
        ))}
      </div>

      {filteredPayouts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">No payouts found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another status filter.
          </p>
        </div>
      )}
    </div>
  );
}
