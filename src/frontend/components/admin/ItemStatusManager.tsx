"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Store, 
  CheckCircle, 
  BarChart3,
  Euro
} from "lucide-react";

interface StatusStats {
  wardrobeItems: number;
  rackItems: number;
  soldItems: number;
  totalValue: number;
  averagePrice: number;
  recentItems: number;
  categoryBreakdown: Record<string, number>;
  conditionBreakdown: Record<string, number>;
}

export function ItemStatusManager() {
  const [stats, setStats] = useState<StatusStats>({
    wardrobeItems: 0,
    rackItems: 0,
    soldItems: 0,
    totalValue: 0,
    averagePrice: 0,
    recentItems: 0,
    categoryBreakdown: {},
    conditionBreakdown: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch status statistics
  const fetchStatusStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/items');
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
      } else {
        setError(data.error || "Failed to fetch status statistics");
      }
    } catch (err) {
      console.error("Status stats fetch error:", err);
      setError("An error occurred while fetching status statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusStats();
  }, []);

  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  const getStatusPercentage = (count: number) => {
    const total = stats.wardrobeItems + stats.rackItems + stats.soldItems;
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

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
            <p className="text-lg font-medium">Error loading status data</p>
            <p className="text-sm mt-2">{error}</p>
            <Button onClick={fetchStatusStats} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wardrobe Items</p>
                <p className="text-2xl font-bold text-gray-700">{stats.wardrobeItems}</p>
                <p className="text-xs text-gray-500">{getStatusPercentage(stats.wardrobeItems)}% of total</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rack Items</p>
                <p className="text-2xl font-bold text-blue-600">{stats.rackItems}</p>
                <p className="text-xs text-gray-500">{getStatusPercentage(stats.rackItems)}% of total</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sold Items</p>
                <p className="text-2xl font-bold text-green-600">{stats.soldItems}</p>
                <p className="text-xs text-gray-500">{getStatusPercentage(stats.soldItems)}% of total</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Value</span>
              <span className="font-semibold text-lg">{formatPrice(stats.totalValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Price</span>
              <span className="font-semibold">{formatPrice(stats.averagePrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Items for Sale</span>
              <span className="font-semibold">{stats.rackItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sold Items</span>
              <span className="font-semibold text-green-600">{stats.soldItems}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Items</span>
              <span className="font-semibold text-lg">{stats.wardrobeItems + stats.rackItems + stats.soldItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Recent Items (7 days)</span>
              <span className="font-semibold text-blue-600">{stats.recentItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="font-semibold">
                {stats.rackItems + stats.soldItems > 0 
                  ? Math.round((stats.soldItems / (stats.rackItems + stats.soldItems)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Listings</span>
              <span className="font-semibold">{stats.rackItems}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{category.toLowerCase().replace('_', ' ')}</p>
                <p className="text-xl font-bold text-primary">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Condition Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Condition Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.conditionBreakdown).map(([condition, count]) => (
              <div key={condition} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 capitalize">{condition.toLowerCase().replace('_', ' ')}</p>
                <p className="text-xl font-bold text-primary">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Wardrobe */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-24">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Wardrobe</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gray-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${getStatusPercentage(stats.wardrobeItems)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium w-12 text-right">{stats.wardrobeItems}</span>
            </div>

            {/* Rack */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-24">
                <Store className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Rack</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${getStatusPercentage(stats.rackItems)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium w-12 text-right">{stats.rackItems}</span>
            </div>

            {/* Sold */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-24">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Sold</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${getStatusPercentage(stats.soldItems)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium w-12 text-right">{stats.soldItems}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
