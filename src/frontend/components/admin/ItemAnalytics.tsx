"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Euro,
  Package,
  Store,
  CheckCircle,
  ShoppingCart,
  Target
} from "lucide-react";

interface AnalyticsData {
  totalItems: number;
  wardrobeItems: number;
  rackItems: number;
  soldItems: number;
  totalValue: number;
  averagePrice: number;
  recentItems: number;
  categoryBreakdown: Record<string, number>;
  conditionBreakdown: Record<string, number>;
  monthlyTrends: {
    month: string;
    items: number;
    sales: number;
    revenue: number;
  }[];
  topCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  conversionRates: {
    wardrobeToRack: number;
    rackToSold: number;
    overallConversion: number;
  };
  priceAnalysis: {
    minPrice: number;
    maxPrice: number;
    medianPrice: number;
    averagePrice: number;
  };
}

export function ItemAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30d");

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/items');
      const data = await response.json();

      if (data.success) {
        const stats = data.data.stats;
        
        // Calculate additional analytics
        const totalItems = stats.totalItems;
        const conversionRates = {
          wardrobeToRack: stats.rackItems > 0 ? Math.round((stats.rackItems / totalItems) * 100) : 0,
          rackToSold: stats.rackItems > 0 ? Math.round((stats.soldItems / stats.rackItems) * 100) : 0,
          overallConversion: totalItems > 0 ? Math.round((stats.soldItems / totalItems) * 100) : 0
        };

        const topCategories = Object.entries(stats.categoryBreakdown)
          .map(([category, count]) => ({
            category,
            count: count as number,
            percentage: Math.round((count as number / totalItems) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const priceAnalysis = {
          minPrice: 0, // Would need additional API call for this
          maxPrice: 0, // Would need additional API call for this
          medianPrice: stats.averagePrice,
          averagePrice: stats.averagePrice
        };

        // Mock monthly trends (would need additional API call for real data)
        const monthlyTrends = [
          { month: "Jan", items: 45, sales: 12, revenue: 240 },
          { month: "Feb", items: 52, sales: 18, revenue: 360 },
          { month: "Mar", items: 48, sales: 15, revenue: 300 },
          { month: "Apr", items: 61, sales: 22, revenue: 440 },
          { month: "May", items: 55, sales: 19, revenue: 380 },
          { month: "Jun", items: 67, sales: 25, revenue: 500 }
        ];

        setAnalytics({
          ...stats,
          conversionRates,
          topCategories,
          priceAnalysis,
          monthlyTrends
        });
      } else {
        setError(data.error || "Failed to fetch analytics");
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("An error occurred while fetching analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const formatPrice = (price: number) => {
    return `CHF ${price.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-48 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="text-lg font-medium">Error loading analytics</p>
            <p className="text-sm mt-2">{error}</p>
            <Button onClick={fetchAnalytics} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Item Analytics</h2>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={fetchAnalytics}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-primary">{analytics.totalItems}</p>
                <p className="text-xs text-gray-500">+{analytics.recentItems} this week</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(analytics.totalValue)}</p>
                <p className="text-xs text-gray-500">Market value</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-blue-600">{formatPercentage(analytics.conversionRates.overallConversion)}</p>
                <p className="text-xs text-gray-500">Items sold</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                <p className="text-2xl font-bold text-purple-600">{formatPrice(analytics.averagePrice)}</p>
                <p className="text-xs text-gray-500">Per item</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Wardrobe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full"
                      style={{ width: `${(analytics.wardrobeItems / analytics.totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{analytics.wardrobeItems}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Rack</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(analytics.rackItems / analytics.totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{analytics.rackItems}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Sold</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(analytics.soldItems / analytics.totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{analytics.soldItems}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Wardrobe → Rack</span>
                <span className="font-semibold text-blue-600">{formatPercentage(analytics.conversionRates.wardrobeToRack)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rack → Sold</span>
                <span className="font-semibold text-green-600">{formatPercentage(analytics.conversionRates.rackToSold)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Conversion</span>
                <span className="font-semibold text-purple-600">{formatPercentage(analytics.conversionRates.overallConversion)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Top Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {analytics.topCategories.map((category, index) => (
              <div key={category.category} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">#{index + 1}</div>
                <p className="text-sm text-gray-600 capitalize mb-1">
                  {category.category.toLowerCase().replace('_', ' ')}
                </p>
                <p className="text-xl font-bold text-primary">{category.count}</p>
                <p className="text-xs text-gray-500">{formatPercentage(category.percentage)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthlyTrends.map((trend) => (
              <div key={trend.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-medium w-12">{trend.month}</span>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{trend.items} items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">{trend.sales} sales</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatPrice(trend.revenue)}</p>
                  <p className="text-xs text-gray-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Price Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-xl font-bold text-primary">{formatPrice(analytics.priceAnalysis.averagePrice)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Median</p>
              <p className="text-xl font-bold text-primary">{formatPrice(analytics.priceAnalysis.medianPrice)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Min Price</p>
              <p className="text-xl font-bold text-green-600">{formatPrice(analytics.priceAnalysis.minPrice)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Max Price</p>
              <p className="text-xl font-bold text-red-600">{formatPrice(analytics.priceAnalysis.maxPrice)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
