"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCreationForm } from "./MarketCreationForm";
import { MarketEditForm } from "./MarketEditForm";
import { MarketStatusManager } from "./MarketStatusManager";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Calendar, 
  MapPin, 
  Users, 
  Euro,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

// Types for market data
interface Market {
  id: string;
  name: string;
  description: string;
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
  capacity: {
    maxVendors: number;
    currentVendors: number;
    availableSpots: number;
  };
  pricing: {
    hangerPrice: number;
  };
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface MarketStats {
  totalMarkets: number;
  activeMarkets: number;
  completedMarkets: number;
  totalRevenue: number;
  totalVendors: number;
}

export function AdminMarketManagement() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [stats, setStats] = useState<MarketStats>({
    totalMarkets: 0,
    activeMarkets: 0,
    completedMarkets: 0,
    totalRevenue: 0,
    totalVendors: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("markets");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Fetch markets data
  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/markets?${params}`);
      const data = await response.json();

      if (data.success) {
        setMarkets(data.data.markets);
        // Calculate stats from the markets data
        const marketStats = data.data.markets.reduce((acc: MarketStats, market: Market) => {
          acc.totalMarkets++;
          if (market.status === "ACTIVE") acc.activeMarkets++;
          if (market.status === "COMPLETED") acc.completedMarkets++;
          acc.totalVendors += market.capacity.currentVendors;
          return acc;
        }, {
          totalMarkets: 0,
          activeMarkets: 0,
          completedMarkets: 0,
          totalRevenue: 0,
          totalVendors: 0
        });
        setStats(marketStats);
      } else {
        setError(data.error || "Failed to fetch markets");
      }
    } catch (err) {
      setError("An error occurred while fetching markets");
      console.error("Error fetching markets:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    fetchMarkets();
  }, [currentPage, statusFilter, searchTerm, fetchMarkets]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const target = event.target as Element;
        // Check if the click is inside a dropdown
        const dropdownElement = document.querySelector(`[data-dropdown-id="${openDropdown}"]`);
        if (dropdownElement && !dropdownElement.contains(target)) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Handle successful market creation
  const handleMarketCreated = (_newMarket: any) => {
    // Refresh the markets list
    fetchMarkets();
    // Switch back to markets tab
    setActiveTab("markets");
  };

  // Handle market view
  const handleViewMarket = (market: Market) => {
    setSelectedMarket(market);
    setShowViewForm(true);
    setActiveTab("view");
  };

  // Handle market edit
  const handleEditMarket = (market: Market) => {
    setSelectedMarket(market);
    setShowEditForm(true);
    setActiveTab("edit");
  };

  // Handle successful market update
  const handleMarketUpdated = (updatedMarket: Market) => {
    // Update the market in the local state
    setMarkets(prev => prev.map(market => 
      market.id === updatedMarket.id ? updatedMarket : market
    ));
    // Switch back to markets tab
    setActiveTab("markets");
    // Close the edit form
    setShowEditForm(false);
    setSelectedMarket(null);
  };

  // Handle cancel view/edit
  const handleCancelViewEdit = () => {
    setActiveTab("markets");
    setShowViewForm(false);
    setShowEditForm(false);
    setSelectedMarket(null);
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (marketId: string) => {
    setOpenDropdown(openDropdown === marketId ? null : marketId);
  };

  // Handle market status change
  const handleStatusChange = async (marketId: string, newStatus: string) => {
    // Add confirmation for status changes
    const statusMessages = {
      ACTIVE: "activate this market? This will make it visible to vendors.",
      DRAFT: "deactivate this market? This will close registration but keep the market as draft.",
      COMPLETED: "mark this market as completed? This will end the market.",
      CANCELLED: "cancel this market? This action cannot be undone."
    };

    const message = statusMessages[newStatus as keyof typeof statusMessages];
    if (!confirm(`Are you sure you want to ${message}`)) {
      return;
    }

    setUpdatingStatus(marketId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/markets/${marketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the market in the local state
        setMarkets(prev => prev.map(market => 
          market.id === marketId 
            ? { ...market, status: newStatus as Market["status"] }
            : market
        ));
        
        // Update selected market if it's the same one
        if (selectedMarket && selectedMarket.id === marketId) {
          setSelectedMarket(prev => prev ? { ...prev, status: newStatus as Market["status"] } : null);
        }

        // Show success message
        const successMessages = {
          ACTIVE: "Market activated successfully!",
          DRAFT: "Market deactivated successfully!",
          COMPLETED: "Market completed successfully!",
          CANCELLED: "Market cancelled successfully!"
        };
        setSuccessMessage(successMessages[newStatus as keyof typeof successMessages]);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorMessage = data.error || "Failed to update market status";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = "An error occurred while updating market status";
      setError(errorMessage);
      console.error("Error updating market status:", err);
      throw err;
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle market deletion
  const handleDeleteMarket = async (marketId: string) => {
    if (!confirm("Are you sure you want to delete this market? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/markets/${marketId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Remove the market from the local state
        setMarkets(prev => prev.filter(market => market.id !== marketId));
        setSuccessMessage("Market deleted successfully!");
      } else {
        // Show specific error message based on the error type
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
      }
    } catch (err) {
      setError("An error occurred while deleting market");
      console.error("Error deleting market:", err);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: Market["status"]) => {
    const styles = {
      DRAFT: "bg-gray-100 text-gray-800",
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800"
    };
    
    const icons = {
      DRAFT: AlertCircle,
      ACTIVE: Play,
      COMPLETED: CheckCircle,
      CANCELLED: XCircle
    };

    const Icon = icons[status];
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading markets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Display */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMarkets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeMarkets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completedMarkets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="markets">All Markets</TabsTrigger>
            <TabsTrigger value="create">Create Market</TabsTrigger>
            {showViewForm && <TabsTrigger value="view">View Market</TabsTrigger>}
            {showEditForm && <TabsTrigger value="edit">Edit Market</TabsTrigger>}
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("create");
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Market
            </Button>
          </div>
        </div>

        <TabsContent value="markets" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search markets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Markets List */}
          <div className="space-y-4">
            {markets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No markets found</h3>
                    <p>Create your first market to get started.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              markets.map((market) => (
                <Card key={market.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{market.name}</CardTitle>
                        <CardDescription>{market.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(market.status)}
                        <div className="relative">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDropdownToggle(market.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          
                          {openDropdown === market.id && (
                            <div 
                              data-dropdown-id={market.id}
                              className="absolute right-0 top-10 z-[9999] w-56 bg-white border border-gray-200 rounded-lg shadow-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-2">
                                {/* View Action - Always Available */}
                                <button
                                  onClick={() => {
                                    handleViewMarket(market);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-all duration-200"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Market
                                </button>

                                {/* Edit Action - Always Available */}
                                <button
                                  onClick={() => {
                                    handleEditMarket(market);
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-all duration-200"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Market
                                </button>

                                {/* Status Actions */}
                                {market.status === "DRAFT" && (
                                  <button
                                    onClick={() => {
                                      handleStatusChange(market.id, "ACTIVE");
                                      setOpenDropdown(null);
                                    }}
                                    disabled={updatingStatus === market.id}
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                                  >
                                    {updatingStatus === market.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                        Activating...
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-4 w-4" />
                                        Activate Market
                                      </>
                                    )}
                                  </button>
                                )}

                                {market.status === "ACTIVE" && (
                                  <button
                                    onClick={() => {
                                      handleStatusChange(market.id, "DRAFT");
                                      setOpenDropdown(null);
                                    }}
                                    disabled={updatingStatus === market.id}
                                    className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                                  >
                                    {updatingStatus === market.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                                        Deactivating...
                                      </>
                                    ) : (
                                      <>
                                        <Pause className="h-4 w-4" />
                                        Deactivate Market
                                      </>
                                    )}
                                  </button>
                                )}

                                {market.status === "ACTIVE" && (
                                  <button
                                    onClick={() => {
                                      handleStatusChange(market.id, "CANCELLED");
                                      setOpenDropdown(null);
                                    }}
                                    disabled={updatingStatus === market.id}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                                  >
                                    {updatingStatus === market.id ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                        Cancelling...
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-4 w-4" />
                                        Cancel Market
                                      </>
                                    )}
                                  </button>
                                )}

                                {/* Delete Action - Only for DRAFT and CANCELLED */}
                                {(market.status === "DRAFT" || market.status === "CANCELLED") && (
                                  <button
                                    onClick={() => {
                                      handleDeleteMarket(market.id);
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-all duration-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Market
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{market.location.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(market.dates.start)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{market.capacity.currentVendors}/{market.capacity.maxVendors} vendors</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        <span>€{market.pricing.hangerPrice}/hanger</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-xs text-muted-foreground">
                        Created by {market.createdBy.name} • {formatDate(market.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <MarketCreationForm 
            onSuccess={handleMarketCreated}
            onCancel={() => {
              setActiveTab("markets");
            }}
          />
        </TabsContent>

        {showViewForm && selectedMarket && (
          <TabsContent value="view">
            <MarketStatusManager 
              market={selectedMarket}
              onStatusChange={async (marketId, newStatus) => {
                try {
                  await handleStatusChange(marketId, newStatus);
                } catch (error) {
                  // Re-throw the error so MarketStatusManager can handle it
                  throw error;
                }
              }}
              onClose={handleCancelViewEdit}
            />
          </TabsContent>
        )}

        {showEditForm && selectedMarket && (
          <TabsContent value="edit">
            <MarketEditForm 
              market={selectedMarket}
              onSuccess={handleMarketUpdated}
              onCancel={handleCancelViewEdit}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
