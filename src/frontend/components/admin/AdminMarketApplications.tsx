"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, CheckCircle, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketEnrollmentStatus } from "@/lib/markets/enrollment-status";

interface EnrollmentRow {
  id: string;
  status: MarketEnrollmentStatus;
  submittedAt: string;
  seller: {
    id: string;
    name: string;
    email: string | null;
  };
}

interface MarketSummary {
  id: string;
  name: string;
  status: string;
  maxVendors: number;
  dates: { start: string; end: string };
}

type StatusFilter = "all" | MarketEnrollmentStatus;

interface AdminMarketApplicationsProps {
  marketId: string;
}

function formatSubmittedAt(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: MarketEnrollmentStatus): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-900";
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
];

export function AdminMarketApplications({ marketId }: AdminMarketApplicationsProps) {
  const [market, setMarket] = useState<MarketSummary | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [counts, setCounts] = useState({ all: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(
        `/api/admin/markets/${marketId}/enrollments?${params.toString()}`,
        { cache: "no-store" }
      );
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.error || "Failed to load applications");
        return;
      }

      setMarket(json.data.market);
      setEnrollments(json.data.enrollments);
      setCounts(json.data.counts);
    } catch {
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [marketId, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = async (enrollmentId: string, status: MarketEnrollmentStatus) => {
    setUpdatingId(enrollmentId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/admin/markets/${marketId}/enrollments/${enrollmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const json = await response.json();

      if (!response.ok || !json.success) {
        setError(json.error || "Failed to update application");
        return;
      }

      setSuccessMessage(
        status === "APPROVED" ? "Application approved." : "Application rejected."
      );
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchApplications();
    } catch {
      setError("Failed to update application");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !market) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="relative flex items-center justify-center py-1">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="absolute left-0 h-9 w-9 shrink-0"
        >
          <Link href="/admin/markets" aria-label="Back to market management">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="max-w-[70%] text-center">
          <h1 className="text-lg font-bold text-foreground">Applications</h1>
          {market ? (
            <p className="truncate text-sm text-muted-foreground">{market.name}</p>
          ) : null}
        </div>
      </header>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {successMessage ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === tab.id
                ? "border-brand-purple bg-brand-purple text-white"
                : "border-border bg-card text-muted-foreground hover:border-brand-lavender hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.id === "all"
              ? ` (${counts.all})`
              : ` (${counts[tab.id as MarketEnrollmentStatus]})`}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {enrollments.length} application{enrollments.length === 1 ? "" : "s"}
        {market ? ` · ${counts.APPROVED} approved of ${market.maxVendors} vendor spots` : ""}
      </p>

      <div className="space-y-3 pb-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : enrollments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-base font-semibold">No applications</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {statusFilter === "all"
                  ? "Seller applications will appear here when they apply to this market."
                  : `No ${statusFilter.toLowerCase()} applications.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          enrollments.map((enrollment) => (
            <article
              key={enrollment.id}
              className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
            >
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{enrollment.seller.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {enrollment.seller.email || "No email on file"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      statusBadgeClass(enrollment.status)
                    )}
                  >
                    {enrollment.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted {formatSubmittedAt(enrollment.submittedAt)}
                </p>
              </div>

              {enrollment.status === "PENDING" ? (
                <div className="flex border-t border-border/70">
                  <button
                    type="button"
                    disabled={updatingId === enrollment.id}
                    onClick={() => handleStatusChange(enrollment.id, "APPROVED")}
                    className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {updatingId === enrollment.id ? "…" : "Approve"}
                  </button>
                  <div className="w-px bg-border/70" aria-hidden />
                  <button
                    type="button"
                    disabled={updatingId === enrollment.id}
                    onClick={() => handleStatusChange(enrollment.id, "REJECTED")}
                    className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
