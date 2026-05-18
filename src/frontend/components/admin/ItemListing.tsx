"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowDownUp, CheckCircle, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AdminItemListCard,
  type AdminItemListItem,
} from "@/components/admin/AdminItemListCard";
import { type ItemStatus, type ItemCondition } from "@/types/items";
import { cn } from "@/lib/utils";

export interface AdminItem extends AdminItemListItem {
  owner_id: string;
  description: string;
  size: string | null;
  condition: ItemCondition;
  color: string | null;
  image_urls: string[];
  market_id: string | null;
  listed_at: string | null;
  sold_at: string | null;
  buyer_id: string | null;
  updated_at: string;
  owner: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  buyer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  market?: {
    id: string;
    name: string;
    location_name: string;
    location_address: string;
  };
}

interface ItemStats {
  totalItems: number;
  wardrobeItems: number;
  rackItems: number;
  soldItems: number;
}

type StatusFilter = "all" | ItemStatus;
type SortKey = "created_at" | "title" | "selling_price";
type SortOrder = "asc" | "desc";

interface ItemListingProps {
  onViewItem: (item: AdminItem) => void;
  onDeleteItem: (item: AdminItem) => void;
  onStatusChange: (itemId: string, newStatus: ItemStatus) => void;
}

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All items" },
  { id: "WARDROBE", label: "Wardrobe" },
  { id: "RACK", label: "On rack" },
  { id: "SOLD", label: "Sold" },
];

function percent(part: number, total: number): string {
  if (total <= 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

interface StatCardProps {
  label: string;
  value: number;
  subLabel?: string;
  subClassName?: string;
  icon?: React.ReactNode;
}

function StatCard({ label, value, subLabel, subClassName, icon }: StatCardProps) {
  return (
    <Card className="rounded-xl border-border/70 shadow-sm">
      <CardContent className="flex min-w-0 flex-col gap-0.5 p-2 sm:gap-1 sm:p-3">
        <p className="truncate text-[10px] font-medium leading-tight text-muted-foreground sm:text-xs">
          {label}
        </p>
        <p className="text-lg font-bold leading-none text-foreground sm:text-2xl">
          {value.toLocaleString()}
        </p>
        {subLabel ? (
          <p
            className={cn(
              "flex items-center gap-0.5 truncate text-[10px] font-medium leading-tight sm:gap-1 sm:text-xs",
              subClassName
            )}
          >
            {icon}
            {subLabel}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ItemListing({ onViewItem, onDeleteItem, onStatusChange }: ItemListingProps) {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [stats, setStats] = useState<ItemStats>({
    totalItems: 0,
    wardrobeItems: 0,
    rackItems: 0,
    soldItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        sortBy: sortKey,
        sortOrder,
      });

      const response = await fetch(`/api/admin/items?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data.items || []);
        const apiStats = data.data.stats;
        if (apiStats) {
          setStats({
            totalItems: apiStats.totalItems ?? 0,
            wardrobeItems: apiStats.wardrobeItems ?? 0,
            rackItems: apiStats.rackItems ?? 0,
            soldItems: apiStats.soldItems ?? 0,
          });
        }
      } else {
        setError(data.error || "Failed to fetch items");
      }
    } catch {
      setError("An error occurred while fetching items");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, sortKey, sortOrder, itemsPerPage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  const filteredCountLabel = useMemo(() => {
    const count = statusFilter === "all" ? stats.totalItems : items.length;
    return `${count.toLocaleString()} item${count === 1 ? "" : "s"}`;
  }, [statusFilter, stats.totalItems, items.length]);

  const handleStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    try {
      setActionLoading(itemId);
      const response = await fetch("/api/admin/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          updates: {
            status: newStatus,
            ...(newStatus === "RACK" && { listed_at: new Date().toISOString() }),
            ...(newStatus === "SOLD" && { sold_at: new Date().toISOString() }),
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
              : item
          )
        );
        onStatusChange(itemId, newStatus);
        await fetchItems();
      } else {
        setError(data.error || "Failed to update item status");
      }
    } catch {
      setError("An error occurred while updating item status");
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const cycleSort = () => {
    if (sortKey === "created_at") {
      setSortKey("title");
      setSortOrder("asc");
      return;
    }
    if (sortKey === "title") {
      setSortKey("selling_price");
      setSortOrder("desc");
      return;
    }
    setSortKey("created_at");
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  const sortLabel =
    sortKey === "title"
      ? "Title"
      : sortKey === "selling_price"
        ? "Price"
        : sortOrder === "desc"
          ? "Newest"
          : "Oldest";

  if (loading && items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse rounded-xl">
              <CardContent className="h-16 p-2 sm:h-20 sm:p-3" />
            </Card>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-center text-destructive">
          <p className="text-lg font-medium">Error loading items</p>
          <p className="mt-2 text-sm">{error}</p>
          <Button onClick={fetchItems} className="mt-4">
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const total = stats.totalItems;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Total" value={total} />
        <StatCard
          label="Wardrobe"
          value={stats.wardrobeItems}
          subLabel={percent(stats.wardrobeItems, total)}
          subClassName="text-orange-700"
        />
        <StatCard
          label="On rack"
          value={stats.rackItems}
          subLabel={percent(stats.rackItems, total)}
          subClassName="text-foreground"
          icon={<CheckCircle className="h-3 w-3" aria-hidden />}
        />
        <StatCard
          label="Sold"
          value={stats.soldItems}
          subLabel={percent(stats.soldItems, total)}
          subClassName="text-brand-purple"
        />
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => {
              setStatusFilter(filter.id);
              setCurrentPage(1);
            }}
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
        <p className="text-sm text-muted-foreground">{filteredCountLabel}</p>
        <button
          type="button"
          onClick={cycleSort}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Sort
          <span className="text-foreground">{sortLabel}</span>
          <ArrowDownUp className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <p className="font-medium text-foreground">No items found</p>
            <p className="text-sm text-muted-foreground">
              Try another filter or search term.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <AdminItemListCard
                item={item}
                isUpdating={actionLoading === item.id}
                isMoreOpen={openDropdown === item.id}
                onView={() => onViewItem(item)}
                onMoveToRack={() => handleStatusChange(item.id, "RACK")}
                onMoveToWardrobe={() => handleStatusChange(item.id, "WARDROBE")}
                onMarkSold={() => handleStatusChange(item.id, "SOLD")}
                onDelete={() => onDeleteItem(item)}
                onMoreToggle={() =>
                  setOpenDropdown(openDropdown === item.id ? null : item.id)
                }
              />
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 ? (
        <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {currentPage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={items.length < itemsPerPage || loading}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
