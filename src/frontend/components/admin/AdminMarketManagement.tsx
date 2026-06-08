"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MarketCreationForm } from "./MarketCreationForm";
import { MarketEditForm } from "./MarketEditForm";
import { MarketStatusManager } from "./MarketStatusManager";
import { MarketConfirmationDialog, MarketAction } from "./MarketConfirmationDialog";
import {
  AdminMarketListCard,
  type MarketDisplayPhase,
} from "./AdminMarketListCard";
import {
  Plus,
  Search,
  ArrowLeft,
  Filter,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface Market {
  id: string;
  name: string;
  description: string;
  picture?: string;
  location: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
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
    maxVendors: number;
    currentVendors: number;
    availableSpots: number;
    maxHangers: number;
    currentHangers: number;
    availableHangers: number;
  };
  pricing: {
    hangerPrice: number;
  };
  policy?: {
    unlimitedHangersPerSeller: boolean;
    maxHangersPerSeller: number;
  };
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  statistics?: {
    totalHangersRented: number;
    totalItems: number;
    totalRentals: number;
    totalTransactions: number;
  };
  createdAt: string;
  updatedAt: string;
}

type MarketTab = "upcoming" | "active" | "past" | "draft";
type SortField = "start_date" | "name" | "created_at";
type SortOrder = "asc" | "desc";

export function AdminMarketManagement() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [marketTab, setMarketTab] = useState<MarketTab>("active");
  const [sortBy, setSortBy] = useState<SortField>("start_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [currentPage] = useState(1);
  const [panelMode, setPanelMode] = useState<"list" | "view" | "edit">("list");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<MarketAction | null>(null);
  const [dialogMarket, setDialogMarket] = useState<Market | null>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "100",
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/markets?${params}`);
      const data = await response.json();

      if (data.success) {
        setMarkets(data.data.markets);
        setTotalCount(data.data.pagination?.total ?? data.data.markets.length);
      } else {
        setError(data.error || "Failed to fetch markets");
      }
    } catch (err) {
      setError("An error occurred while fetching markets");
      logger.error("Error fetching markets:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchMarkets();
  }, [currentPage, searchTerm, sortBy, sortOrder, fetchMarkets]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openDropdown && !showSortMenu) return;
      const target = event.target as Element;
      if (openDropdown) {
        const dropdownElement = document.querySelector(
          `[data-dropdown-id="${openDropdown}"]`
        );
        if (dropdownElement && !dropdownElement.contains(target)) {
          setOpenDropdown(null);
        }
      }
      if (showSortMenu && !target.closest("[data-sort-menu]")) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, showSortMenu]);

  const handleMarketCreated = () => {
    fetchMarkets();
    setShowCreateForm(false);
  };

  const handleViewMarket = (market: Market) => {
    setSelectedMarket(market);
    setShowViewForm(true);
    setPanelMode("view");
  };

  const handleEditMarket = (market: Market) => {
    setSelectedMarket(market);
    setShowEditForm(true);
    setPanelMode("edit");
  };

  const handleMarketUpdated = (updatedMarket: Market) => {
    setMarkets((prev) =>
      prev.map((market) => (market.id === updatedMarket.id ? updatedMarket : market))
    );
    setPanelMode("list");
    setShowEditForm(false);
    setSelectedMarket(null);
  };

  const handleCancelViewEdit = () => {
    setPanelMode("list");
    setShowViewForm(false);
    setShowEditForm(false);
    setSelectedMarket(null);
  };

  const handleDropdownToggle = (marketId: string) => {
    setOpenDropdown(openDropdown === marketId ? null : marketId);
  };

  const openConfirmationDialog = (market: Market, action: MarketAction) => {
    setDialogMarket(market);
    setDialogAction(action);
    setShowConfirmationDialog(true);
    setError(null);
  };

  const handleMarketConfirmation = async (marketId: string, action: MarketAction) => {
    if (action === "delete") {
      await handleDeleteMarket(marketId);
    } else {
      const statusMap: Record<MarketAction, string> = {
        activate: "ACTIVE",
        deactivate: "DRAFT",
        cancel: "CANCELLED",
        delete: "",
      };
      const newStatus = statusMap[action];
      if (newStatus) {
        await handleStatusChange(marketId, newStatus);
      }
    }
  };

  const handleStatusChange = async (marketId: string, newStatus: string) => {
    setUpdatingStatus(marketId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/markets/${marketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setMarkets((prev) =>
          prev.map((market) =>
            market.id === marketId
              ? { ...market, status: newStatus as Market["status"] }
              : market
          )
        );

        if (selectedMarket?.id === marketId) {
          setSelectedMarket((prev) =>
            prev ? { ...prev, status: newStatus as Market["status"] } : null
          );
        }

        const successMessages = {
          ACTIVE: "Market activated successfully!",
          DRAFT: "Market deactivated successfully!",
          COMPLETED: "Market completed successfully!",
          CANCELLED: "Market cancelled successfully!",
        };
        setSuccessMessage(successMessages[newStatus as keyof typeof successMessages]);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorMessage = data.error || "Failed to update market status";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = "An error occurred while updating market status";
      setError(errorMessage);
      logger.error("Error updating market status:", err);
      throw err;
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteMarket = async (marketId: string) => {
    try {
      const response = await fetch(`/api/admin/markets/${marketId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMarkets((prev) => prev.filter((market) => market.id !== marketId));
        setSuccessMessage("Market deleted successfully!");
      } else {
        let errorMessage = data.error || "Failed to delete market";

        if (data.details) {
          if (data.details.hangerRentalsCount > 0) {
            errorMessage = `Cannot delete market: ${data.details.hangerRentalsCount} seller(s) have rented hangers. Please cancel the market first.`;
          } else if (data.details.itemsCount > 0) {
            errorMessage = `Cannot delete market: ${data.details.itemsCount} item(s) are listed. Please remove all items first.`;
          } else if (data.details.transactionsCount > 0) {
            errorMessage = `Cannot delete market: ${data.details.transactionsCount} transaction(s) exist. Please cancel the market first.`;
          } else if (data.details.currentStatus) {
            errorMessage = `Cannot delete market: Current status is ${data.details.currentStatus}. Only DRAFT and CANCELLED markets can be deleted.`;
          }
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = "An error occurred while deleting market";
      setError(errorMessage);
      logger.error("Error deleting market:", err);
      throw err;
    }
  };

  const filteredMarkets = useMemo(
    () => markets.filter((market) => marketMatchesTab(market, marketTab)),
    [markets, marketTab]
  );

  if (panelMode === "view" && showViewForm && selectedMarket) {
    return (
      <MarketStatusManager
        market={selectedMarket}
        onStatusChange={handleStatusChange}
        onEdit={() => {
          setShowViewForm(false);
          setShowEditForm(true);
          setPanelMode("edit");
        }}
        onClose={handleCancelViewEdit}
      />
    );
  }

  if (panelMode === "edit" && showEditForm && selectedMarket) {
    return (
      <MarketEditForm
        market={selectedMarket}
        onSuccess={handleMarketUpdated}
        onCancel={handleCancelViewEdit}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading markets...</p>
        </div>
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
          <Link href="/admin" aria-label="Back to admin dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold text-foreground">Market Management</h1>
        <div className="absolute right-0 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Create market"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Sort options"
            aria-expanded={showSortMenu}
            onClick={() => setShowSortMenu((open) => !open)}
          >
            <Filter className="h-5 w-5" />
          </Button>
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
        <Card className="border-brand-accent/30 bg-brand-accent/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search markets by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none ring-brand-purple/30 transition-shadow placeholder:text-muted-foreground focus:border-brand-purple focus:ring-2"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MARKET_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMarketTab(tab.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              marketTab === tab.id
                ? "border-brand-purple bg-brand-purple text-white"
                : "border-border bg-card text-muted-foreground hover:border-brand-lavender hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filteredMarkets.length} market{filteredMarkets.length === 1 ? "" : "s"} found
          {searchTerm ? ` · ${totalCount} total` : ""}
        </p>
        <div className="relative" data-sort-menu>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={() => setShowSortMenu((open) => !open)}
          >
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
            Sort
          </Button>
          {showSortMenu ? (
            <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={`${option.field}-${option.order}`}
                  type="button"
                  onClick={() => {
                    setSortBy(option.field);
                    setSortOrder(option.order);
                    setShowSortMenu(false);
                  }}
                  className={cn(
                    "flex w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60",
                    sortBy === option.field && sortOrder === option.order
                      ? "font-semibold text-brand-purple"
                      : "text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 pb-6">
        {filteredMarkets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="text-base font-semibold">No markets found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {marketTab === "draft"
                  ? "Draft markets will appear here."
                  : "Try another tab or create a new market."}
              </p>
              <Button className="mt-4" size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New market
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredMarkets.map((market) => (
            <AdminMarketListCard
              key={market.id}
              market={market}
              displayPhase={getMarketDisplayPhase(market)}
              isUpdating={updatingStatus === market.id}
              isMoreOpen={openDropdown === market.id}
              onEdit={() => handleEditMarket(market)}
              onApprove={() => openConfirmationDialog(market, "activate")}
              onMoreToggle={() => handleDropdownToggle(market.id)}
              onView={() => {
                handleViewMarket(market);
                setOpenDropdown(null);
              }}
              onDeactivate={() => {
                openConfirmationDialog(market, "deactivate");
                setOpenDropdown(null);
              }}
              onCancel={() => {
                openConfirmationDialog(market, "cancel");
                setOpenDropdown(null);
              }}
              onDelete={() => {
                openConfirmationDialog(market, "delete");
                setOpenDropdown(null);
              }}
            />
          ))
        )}
      </div>

      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Market</DialogTitle>
          </DialogHeader>
          <MarketCreationForm
            onSuccess={handleMarketCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>

      <MarketConfirmationDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        market={dialogMarket}
        action={dialogAction}
        onConfirm={handleMarketConfirmation}
        isLoading={updatingStatus !== null}
        error={error}
      />
    </div>
  );
}

function getMarketDisplayPhase(market: Market): MarketDisplayPhase {
  if (market.status === "DRAFT") return "draft";

  const now = Date.now();
  const start = new Date(market.dates.start).getTime();
  const end = new Date(market.dates.end).getTime();

  if (market.status === "COMPLETED" || market.status === "CANCELLED" || end < now) {
    return "past";
  }
  if (start > now) return "upcoming";
  return "active";
}

function marketMatchesTab(market: Market, tab: MarketTab): boolean {
  return getMarketDisplayPhase(market) === tab;
}

const MARKET_TABS: { id: MarketTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "past", label: "Past" },
  { id: "draft", label: "Draft" },
];

const SORT_OPTIONS: { label: string; field: SortField; order: SortOrder }[] = [
  { label: "Start date (soonest)", field: "start_date", order: "asc" },
  { label: "Start date (latest)", field: "start_date", order: "desc" },
  { label: "Name (A–Z)", field: "name", order: "asc" },
  { label: "Recently created", field: "created_at", order: "desc" },
];
