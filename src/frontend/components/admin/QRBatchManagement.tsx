"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getQRBatches, getPlatformQRStats } from "@/features/qr-batches/queries";
import { deleteQRBatch } from "@/features/qr-batches/actions";
import { generateQRCodePDF, downloadPDF, printPDF, generatePDFFilename, type QRCodePDFData, type BatchInfo } from "@/lib/qr/pdf-export";
import { QRBatchCreationForm } from "./QRBatchCreationForm";
import { QR_CREATE_BATCH_EVENT } from "./qr-create-batch-trigger";
import type { PlatformQRStats, QRBatchWithStats } from "@/types/qr-codes";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowDownUp,
  Check,
  Download,
  Eye,
  MoreHorizontal,
  Plus,
  Printer,
  QrCode,
  Trash2,
} from "lucide-react";

type StatusFilter = "all" | "linked" | "unused" | "broken";
type SortOption = "newest" | "oldest" | "most-codes" | "most-linked";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All Codes" },
  { id: "linked", label: "Linked" },
  { id: "unused", label: "Unused" },
  { id: "broken", label: "Broken" },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "most-codes", label: "Most codes" },
  { id: "most-linked", label: "Most linked" },
];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatBatchTitle(batch: QRBatchWithStats): string {
  if (batch.name?.trim()) {
    return batch.name.trim();
  }
  return `BATCH-${batch.prefix}`;
}

function getBatchStatus(batch: QRBatchWithStats): { label: string; className: string } {
  if (batch.statistics.invalid > 0) {
    return { label: "Broken", className: "bg-red-100 text-red-800" };
  }
  if (batch.statistics.linked > 0) {
    return { label: "Active", className: "bg-brand-accent/15 text-foreground" };
  }
  return { label: "Unused", className: "bg-amber-100 text-amber-800" };
}

function getLinkedLabel(batch: QRBatchWithStats): string {
  const { linked } = batch.statistics;
  const marketName = batch.market?.name?.trim();

  if (marketName && linked > 0) {
    return `${linked} linked · ${marketName}`;
  }
  if (marketName) {
    return marketName;
  }
  if (linked > 0) {
    return `${linked} of ${batch.code_count} linked`;
  }
  return "No codes linked yet";
}

interface StatCardProps {
  label: string;
  value: number | string;
  subLabel?: string;
  subClassName?: string;
  loading?: boolean;
  className?: string;
}

function StatCard({
  label,
  value,
  subLabel,
  subClassName,
  loading,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-border/70 bg-card px-3 py-2.5 shadow-sm sm:px-4 sm:py-3",
        className
      )}
    >
      <p className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">
        {label}
      </p>
      {loading ? (
        <div className="mt-1.5 h-6 w-14 animate-pulse rounded bg-muted sm:mt-2 sm:h-7 sm:w-16" />
      ) : (
        <p className="mt-0.5 text-base font-bold tabular-nums text-foreground sm:text-lg">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      )}
      {subLabel && !loading ? (
        <p className={cn("mt-0.5 text-[11px] font-medium sm:mt-1 sm:text-xs", subClassName)}>
          {subLabel}
        </p>
      ) : null}
    </div>
  );
}

interface QRBatchListCardProps {
  batch: QRBatchWithStats;
  isExporting: boolean;
  isPrinting: boolean;
  isMoreOpen: boolean;
  onView: () => void;
  onExport: () => void;
  onPrint: () => void;
  onMoreToggle: () => void;
  onDelete: () => void;
}

function QRBatchListCard({
  batch,
  isExporting,
  isPrinting,
  isMoreOpen,
  onView,
  onExport,
  onPrint,
  onMoreToggle,
  onDelete,
}: QRBatchListCardProps) {
  const badge = getBatchStatus(batch);

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-purple">
          <QrCode className="h-7 w-7 text-white" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-foreground">
            {formatBatchTitle(batch)}
          </h3>
          <p className="text-sm text-muted-foreground">
            Linked to: {getLinkedLabel(batch)}
          </p>
          <p className="text-xs text-muted-foreground">
            Created: {formatDate(batch.created_at)}
          </p>
        </div>

        <div className="flex shrink-0 items-start gap-4">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-muted-foreground">Codes</span>
            <span className="text-sm font-bold tabular-nums">
              {batch.code_count.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-muted-foreground">Status</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                badge.className
              )}
            >
              {badge.label}
            </span>
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

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={isExporting || isPrinting}
              className="flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium text-brand-purple transition-colors hover:bg-brand-lavender/20 disabled:opacity-50"
              aria-haspopup="menu"
            >
              <Download className="h-4 w-4" aria-hidden />
              {isExporting ? "…" : isPrinting ? "Printing…" : "Export"}
            </button>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-44 p-1">
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted/60 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              type="button"
              onClick={onPrint}
              disabled={isPrinting}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted/60 disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </PopoverContent>
        </Popover>

        <div className="w-px bg-border/70" aria-hidden />

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
              data-dropdown-id={batch.id}
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
              <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete batch
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function QRBatchManagement() {
  const [batches, setBatches] = useState<QRBatchWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformQRStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<QRBatchWithStats | null>(null);
  const [exportingBatch, setExportingBatch] = useState<string | null>(null);
  const [printingBatch, setPrintingBatch] = useState<string | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<QRBatchWithStats | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getQRBatches({
        page: pagination.page,
        limit: pagination.limit,
      });

      setBatches(data.batches);
      setPagination(data.pagination);
    } catch (err) {
      setError("Failed to fetch QR batches");
      console.error("Error fetching batches:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await getPlatformQRStats();
        setPlatformStats(stats);
      } catch (err) {
        console.error("Error fetching platform QR stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    loadStats();
  }, [batches]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openDropdown) return;
      const dropdownElement = document.querySelector(
        `[data-dropdown-id="${openDropdown}"]`
      );
      if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Open the create-batch dialog when the header "+" trigger fires (mobile, issue #30).
  useEffect(() => {
    const handleCreateBatch = () => setShowCreateForm(true);
    window.addEventListener(QR_CREATE_BATCH_EVENT, handleCreateBatch);
    return () => window.removeEventListener(QR_CREATE_BATCH_EVENT, handleCreateBatch);
  }, []);

  const handleBatchCreated = async () => {
    setShowCreateForm(false);
    await fetchBatches();
    const stats = await getPlatformQRStats();
    setPlatformStats(stats);
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;

    try {
      setDeletingBatch(batchToDelete.id);
      setDeleteError(null);

      const result = await deleteQRBatch(batchToDelete.id);

      if (result.error) {
        setDeleteError(result.error);
      } else {
        setBatchToDelete(null);
        await fetchBatches();
        if (selectedBatch?.id === batchToDelete.id) {
          setSelectedBatch(null);
        }
      }
    } catch (err) {
      setDeleteError("Failed to delete batch");
      console.error("Error deleting batch:", err);
    } finally {
      setDeletingBatch(null);
    }
  };

  // Shared PDF builder for both the download and print actions (issue #40).
  const buildBatchPDF = async (
    batchId: string
  ): Promise<{ blob: Blob; filename: string } | null> => {
    const res = await fetch(`/api/admin/qr-batches/${batchId}/export`, {
      cache: "no-store",
    });
    const json = await res.json();

    if (!json?.success) {
      setError(json.error || "Failed to export QR batch");
      return null;
    }

    const { batch, qrCodes } = json.data;

    const { generateBatchQRCodeImages } = await import("@/lib/qr/generation");

    const qrCodeImages = await generateBatchQRCodeImages(qrCodes, {
      width: 300,
      margin: 2,
    });

    const blob = await generateQRCodePDF(
      qrCodeImages as QRCodePDFData[],
      batch as BatchInfo
    );

    const filename = generatePDFFilename(batch as BatchInfo);
    return { blob, filename };
  };

  const handleExportPDF = async (batchId: string) => {
    try {
      setExportingBatch(batchId);
      const result = await buildBatchPDF(batchId);
      if (result) {
        downloadPDF(result.blob, result.filename);
      }
    } catch (err) {
      setError("Failed to export PDF");
      console.error("Error exporting PDF:", err);
    } finally {
      setExportingBatch(null);
      setOpenDropdown(null);
    }
  };

  const handlePrintPDF = async (batchId: string) => {
    try {
      setPrintingBatch(batchId);
      const result = await buildBatchPDF(batchId);
      if (result) {
        printPDF(result.blob);
      }
    } catch (err) {
      setError("Failed to print PDF");
      console.error("Error printing PDF:", err);
    } finally {
      setPrintingBatch(null);
      setOpenDropdown(null);
    }
  };

  const filteredBatches = useMemo(() => {
    let result = [...batches];

    if (statusFilter === "linked") {
      result = result.filter((b) => b.statistics.linked > 0);
    } else if (statusFilter === "unused") {
      result = result.filter((b) => b.statistics.unused > 0);
    } else if (statusFilter === "broken") {
      result = result.filter((b) => b.statistics.invalid > 0);
    }

    result.sort((a, b) => {
      if (sortOption === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortOption === "most-codes") {
        return b.code_count - a.code_count;
      }
      if (sortOption === "most-linked") {
        return b.statistics.linked - a.statistics.linked;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [batches, statusFilter, sortOption]);

  const sortLabel =
    SORT_OPTIONS.find((option) => option.id === sortOption)?.label ?? "Newest first";

  const totalCodes = platformStats?.total ?? 0;
  const linkedCount = platformStats?.linked ?? 0;
  const unusedCount = platformStats?.unused ?? 0;
  const brokenCount = platformStats?.invalid ?? 0;
  const linkedPct = platformStats?.linked_percentage ?? 0;
  const unusedPct = platformStats?.unused_percentage ?? 0;
  const brokenPct = platformStats?.invalid_percentage ?? 0;

  return (
    <div className="space-y-4">
      <div className="hidden justify-end md:flex">
        <Button onClick={() => setShowCreateForm(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Create Batch
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard label="Total" value={totalCodes} loading={statsLoading} />
        <StatCard
          label="Linked"
          value={linkedCount}
          subLabel={`${formatPct(linkedPct)} ✓`}
          subClassName="text-foreground"
          loading={statsLoading}
        />
        <StatCard
          label="Unused"
          value={unusedCount}
          subLabel={formatPct(unusedPct)}
          subClassName="text-amber-700"
          loading={statsLoading}
        />
        <StatCard
          className="hidden sm:block"
          label="Broken"
          value={brokenCount}
          subLabel={formatPct(brokenPct)}
          subClassName="text-red-600"
          loading={statsLoading}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setStatusFilter(filter.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === filter.id
                ? "border-brand-purple bg-brand-purple text-white"
                : "border-border bg-card text-muted-foreground hover:border-brand-purple/40 hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filteredBatches.length} batch{filteredBatches.length === 1 ? "" : "es"}
        </p>
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-purple"
            >
              <ArrowDownUp className="h-4 w-4" aria-hidden />
              Sort
              <span className="text-muted-foreground">{sortLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSortOption(option.id);
                  setSortOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  sortOption === option.id && "font-medium text-brand-purple"
                )}
              >
                {option.label}
                {sortOption === option.id ? (
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                ) : null}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {error ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredBatches.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-border/70">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <QrCode className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <p className="font-medium text-foreground">No QR batches found</p>
            <p className="text-sm text-muted-foreground">
              {statusFilter === "all"
                ? "Create a batch to generate QR codes for a market."
                : "Try another filter."}
            </p>
            {statusFilter === "all" ? (
              <Button onClick={() => setShowCreateForm(true)} variant="outline" className="mt-1">
                <Plus className="mr-2 h-4 w-4" />
                Create Batch
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filteredBatches.map((batch) => (
            <li key={batch.id}>
              <QRBatchListCard
                batch={batch}
                isExporting={exportingBatch === batch.id}
                isPrinting={printingBatch === batch.id}
                isMoreOpen={openDropdown === batch.id}
                onView={() => {
                  setOpenDropdown(null);
                  setSelectedBatch(batch);
                }}
                onExport={() => handleExportPDF(batch.id)}
                onPrint={() => handlePrintPDF(batch.id)}
                onMoreToggle={() =>
                  setOpenDropdown(openDropdown === batch.id ? null : batch.id)
                }
                onDelete={() => {
                  setOpenDropdown(null);
                  setBatchToDelete(batch);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create QR Code Batch</DialogTitle>
            <DialogDescription>
              Generate a new batch of QR codes for a market or general use
            </DialogDescription>
          </DialogHeader>
          <QRBatchCreationForm
            onSuccess={handleBatchCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Batch Details: {selectedBatch ? formatBatchTitle(selectedBatch) : ""}
            </DialogTitle>
            <DialogDescription>
              View detailed information about this QR code batch
            </DialogDescription>
          </DialogHeader>
          {selectedBatch ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Prefix</p>
                  <p className="font-mono text-lg">{selectedBatch.prefix}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Codes</p>
                  <p className="text-lg font-semibold">{selectedBatch.code_count}</p>
                </div>
                {selectedBatch.market ? (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Market</p>
                    <p className="text-lg">{selectedBatch.market.name}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-lg">{formatDate(selectedBatch.created_at)}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">Statistics</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Card className="rounded-2xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Unused</p>
                      <p className="text-2xl font-bold">{selectedBatch.statistics.unused}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedBatch.statistics.unused_percentage.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Linked</p>
                      <p className="text-2xl font-bold">{selectedBatch.statistics.linked}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedBatch.statistics.linked_percentage.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-2xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Sold</p>
                      <p className="text-2xl font-bold text-brand-accent">
                        {selectedBatch.statistics.sold}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedBatch.statistics.sold_percentage.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                  {selectedBatch.statistics.invalid > 0 ? (
                    <Card className="rounded-2xl">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Broken</p>
                        <p className="text-2xl font-bold text-red-600">
                          {selectedBatch.statistics.invalid}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedBatch.statistics.invalid_percentage.toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleExportPDF(selectedBatch.id)}
                  disabled={exportingBatch === selectedBatch.id}
                >
                  {exportingBatch === selectedBatch.id ? (
                    "Exporting..."
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBatchToDelete(selectedBatch);
                    setSelectedBatch(null);
                  }}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Batch
                </Button>
                <Button variant="outline" onClick={() => setSelectedBatch(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!batchToDelete} onOpenChange={(open) => !open && setBatchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete QR Batch</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to delete the batch &quot;
              {batchToDelete ? formatBatchTitle(batchToDelete) : ""}&quot;?
              <br />
              <br />
              This will permanently delete:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>The batch record</li>
                <li>All {batchToDelete?.code_count || 0} QR codes in this batch</li>
                {batchToDelete &&
                (batchToDelete.statistics.linked > 0 || batchToDelete.statistics.sold > 0) ? (
                  <li className="font-medium text-red-600">
                    Warning: {batchToDelete.statistics.linked} linked and{" "}
                    {batchToDelete.statistics.sold} sold codes will be deleted
                  </li>
                ) : null}
              </ul>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {deleteError}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={!!deletingBatch}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={handleDeleteBatch}
                disabled={!!deletingBatch}
              >
                {deletingBatch ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Batch
                  </>
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
