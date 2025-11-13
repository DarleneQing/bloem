"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  Search, 
  Filter, 
  Package, 
  MoreVertical, 
  Eye, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Euro,
  User,
  Store,
  Tag
} from "lucide-react";
import { ITEM_CATEGORIES, ITEM_CONDITIONS, type ItemStatus, type ItemCategory, type ItemCondition } from "@/types/items";

// Types for item data
interface Item {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  brand: string | null;
  category: ItemCategory;
  size: string | null;
  condition: ItemCondition;
  color: string | null;
  selling_price: number | null;
  status: ItemStatus;
  image_urls: string[];
  thumbnail_url: string;
  market_id: string | null;
  listed_at: string | null;
  sold_at: string | null;
  buyer_id: string | null;
  created_at: string;
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

interface ItemListingProps {
  onViewItem: (item: Item) => void;
  onDeleteItem: (item: Item) => void;
  onStatusChange: (itemId: string, newStatus: ItemStatus) => void;
}

export function ItemListing({ onViewItem, onDeleteItem, onStatusChange }: ItemListingProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch items data
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(conditionFilter !== "all" && { condition: conditionFilter }),
        sortBy: "created_at",
        sortOrder: "desc"
      });

      const response = await fetch(`/api/admin/items?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data.items || []);
      } else {
        setError(data.error || "Failed to fetch items");
      }
    } catch (err) {
      console.error("Items fetch error:", err);
      setError("An error occurred while fetching items");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, categoryFilter, conditionFilter, itemsPerPage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle dropdown toggle and click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const dropdownElement = document.querySelector(`[data-dropdown-id="${openDropdown}"]`);
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    
    return undefined;
  }, [openDropdown]);

  const handleDropdownToggle = (itemId: string) => {
    setOpenDropdown(openDropdown === itemId ? null : itemId);
  };

  const handleStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    try {
      setActionLoading(itemId);
      const response = await fetch('/api/admin/items', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          updates: { 
            status: newStatus,
            ...(newStatus === 'RACK' && { listed_at: new Date().toISOString() }),
            ...(newStatus === 'SOLD' && { sold_at: new Date().toISOString() })
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? { ...item, status: newStatus, updated_at: new Date().toISOString() }
              : item
          )
        );
        onStatusChange(itemId, newStatus);
      } else {
        setError(data.error || "Failed to update item status");
      }
    } catch (err) {
      setError("An error occurred while updating item status");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Not set";
    return `CHF ${price.toFixed(2)}`;
  };

  const getStatusIcon = (status: ItemStatus) => {
    switch (status) {
      case "WARDROBE":
        return <Package className="w-4 h-4 text-gray-500" />;
      case "RACK":
        return <Store className="w-4 h-4 text-blue-500" />;
      case "SOLD":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case "WARDROBE":
        return "bg-gray-100 text-gray-700";
      case "RACK":
        return "bg-blue-100 text-blue-700";
      case "SOLD":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Item</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Owner</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Category</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Price</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Created</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.thumbnail_url ? (
                      <Image 
                        src={item.thumbnail_url} 
                        alt={item.title}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.brand || "No brand"}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{item.owner.first_name} {item.owner.last_name}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{ITEM_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{formatPrice(item.selling_price)}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600">{formatDate(item.created_at)}</td>
              <td className="py-3 px-4">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDropdownToggle(item.id)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  
                  {openDropdown === item.id && (
                    <div 
                      data-dropdown-id={item.id}
                      className="absolute right-0 top-10 z-[9999] w-48 bg-white border border-gray-200 rounded-lg shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-2">
                        {/* View Action */}
                        <button
                          onClick={() => {
                            onViewItem(item);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                          View Item
                        </button>

                        {/* Status Change Actions */}
                        {item.status !== "WARDROBE" && (
                          <button
                            onClick={() => {
                              handleStatusChange(item.id, "WARDROBE");
                              setOpenDropdown(null);
                            }}
                            disabled={actionLoading === item.id}
                            className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                          >
                            <Package className="h-4 w-4" />
                            Move to Wardrobe
                          </button>
                        )}

                        {item.status !== "RACK" && (
                          <button
                            onClick={() => {
                              handleStatusChange(item.id, "RACK");
                              setOpenDropdown(null);
                            }}
                            disabled={actionLoading === item.id}
                            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                          >
                            <Store className="h-4 w-4" />
                            Move to Rack
                          </button>
                        )}

                        {item.status !== "SOLD" && (
                          <button
                            onClick={() => {
                              handleStatusChange(item.id, "SOLD");
                              setOpenDropdown(null);
                            }}
                            disabled={actionLoading === item.id}
                            className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-3 transition-all duration-200 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark as Sold
                          </button>
                        )}

                        {/* Delete Action */}
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            onDeleteItem(item);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {item.thumbnail_url ? (
                  <Image 
                    src={item.thumbnail_url} 
                    alt={item.title}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover"
                  />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{item.title}</h3>
                <p className="text-sm text-gray-500 truncate">{item.brand || "No brand"}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(item.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{item.owner.first_name} {item.owner.last_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>{ITEM_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4" />
                <span>{formatPrice(item.selling_price)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDropdownToggle(item.id)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {openDropdown === item.id && (
              <div 
                data-dropdown-id={item.id}
                className="absolute right-4 top-16 z-[9999] w-48 bg-white border border-gray-200 rounded-lg shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-2">
                  <button
                    onClick={() => {
                      onViewItem(item);
                      setOpenDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-3 transition-all duration-200"
                  >
                    <Eye className="h-4 w-4" />
                    View Item
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      onDeleteItem(item);
                      setOpenDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Item
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="text-lg font-medium">Error loading items</p>
            <p className="text-sm mt-2">{error}</p>
            <Button onClick={fetchItems} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-w-0"
              >
                <option value="all">All Status</option>
                <option value="WARDROBE">Wardrobe</option>
                <option value="RACK">Rack</option>
                <option value="SOLD">Sold</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-w-0"
              >
                <option value="all">All Categories</option>
                {ITEM_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-w-0"
              >
                <option value="all">All Conditions</option>
                {ITEM_CONDITIONS.map(condition => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
              
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
              
              <Button variant="outline" size="sm" className="sm:hidden">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              title="Card View"
            >
              <Package className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === "table" && <TableView />}
        {viewMode === "cards" && <CardView />}

        {/* Results count and pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {items.length} items
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={items.length < itemsPerPage}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
