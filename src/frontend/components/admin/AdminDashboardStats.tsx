"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Store, 
  Package, 
  QrCode, 
  CreditCard, 
  TrendingUp,
  Activity,
  ArrowRight
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalMarkets: number;
    totalItems: number;
    totalTransactions: number;
    totalRevenue: number;
    platformFees: number;
    sellerEarnings: number;
    totalHangerRentals: number;
    totalHangersRented: number;
    totalHangerRevenue: number;
    totalQrCodes: number;
  };
  markets: {
    total: number;
    active: number;
    draft: number;
    completed: number;
    cancelled: number;
    totalVendors: number;
    totalCapacity: number;
    utilizationRate: number;
  };
  items: {
    total: number;
    wardrobe: number;
    rack: number;
    sold: number;
  };
  transactions: {
    total: number;
    completed: number;
    totalRevenue: number;
    platformFees: number;
    sellerEarnings: number;
  };
  growth: {
    users: {
      recent: number;
      growthRate: number;
    };
    markets: {
      recent: number;
      growthRate: number;
    };
    items: {
      recent: number;
      growthRate: number;
    };
    revenue: {
      recent: number;
      growthRate: number;
    };
  };
  systemHealth: {
    uptime: number;
    activeUsers: number;
    systemLoad: number;
  };
}

export function AdminDashboardStats() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics');
        const data = await response.json();

        if (data.success) {
          setAnalytics(data.data);
        } else {
          setError(data.error || "Failed to fetch analytics");
        }
      } catch (err) {
        setError("An error occurred while fetching analytics");
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
              <div className="h-3 bg-gray-200 rounded w-32 mt-1"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-800">
          <Activity className="h-4 w-4" />
          <span className="font-medium">Error loading analytics</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      title: "Total Users",
      value: analytics.overview.totalUsers.toLocaleString(),
      change: analytics.growth.users.growthRate > 0 ? `+${analytics.growth.users.growthRate}%` : `${analytics.growth.users.growthRate}%`,
      changeType: analytics.growth.users.growthRate >= 0 ? "positive" as const : "negative" as const,
      icon: Users,
      description: "Active platform users"
    },
    {
      title: "Active Markets",
      value: analytics.markets.active.toString(),
      change: analytics.growth.markets.growthRate > 0 ? `+${analytics.growth.markets.growthRate}%` : `${analytics.growth.markets.growthRate}%`,
      changeType: analytics.growth.markets.growthRate >= 0 ? "positive" as const : "negative" as const,
      icon: Store,
      description: "Currently running markets"
    },
    {
      title: "Total Items",
      value: analytics.overview.totalItems.toLocaleString(),
      change: analytics.growth.items.growthRate > 0 ? `+${analytics.growth.items.growthRate}%` : `${analytics.growth.items.growthRate}%`,
      changeType: analytics.growth.items.growthRate >= 0 ? "positive" as const : "negative" as const,
      icon: Package,
      description: "Items in platform wardrobes"
    },
    {
      title: "QR Codes Generated",
      value: analytics.overview.totalQrCodes.toLocaleString(),
      change: "+0%", // QR codes growth not tracked yet
      changeType: "positive" as const,
      icon: QrCode,
      description: "QR codes created"
    },
    {
      title: "Total Revenue",
      value: `€${analytics.overview.totalRevenue.toLocaleString()}`,
      change: analytics.growth.revenue.growthRate > 0 ? `+${analytics.growth.revenue.growthRate}%` : `${analytics.growth.revenue.growthRate}%`,
      changeType: analytics.growth.revenue.growthRate >= 0 ? "positive" as const : "negative" as const,
      icon: CreditCard,
      description: "Total platform revenue"
    },
    {
      title: "Platform Activity",
      value: `${analytics.systemHealth.uptime}%`,
      change: "+0.1%",
      changeType: "positive" as const,
      icon: Activity,
      description: "System uptime"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Main Statistics Grid */}
      <div>
        <h2 className="text-xl font-bold text-primary mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span className={stat.changeType === "positive" ? "text-green-600" : "text-red-600"}>
                      {stat.change}
                    </span>
                    <span>from last month</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Market Analytics Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">Market Analytics</h2>
          <Link href="/admin/markets">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              Manage Markets
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Market Status
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active:</span>
                  <span className="font-medium text-green-600">{analytics.markets.active}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Draft:</span>
                  <span className="font-medium text-yellow-600">{analytics.markets.draft}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed:</span>
                  <span className="font-medium text-blue-600">{analytics.markets.completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cancelled:</span>
                  <span className="font-medium text-red-600">{analytics.markets.cancelled}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendor Capacity
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{analytics.markets.totalVendors}</div>
              <div className="text-sm text-muted-foreground">
                of {analytics.markets.totalCapacity} total capacity
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Utilization</span>
                  <span>{analytics.markets.utilizationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(analytics.markets.utilizationRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Item Status
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Wardrobe:</span>
                  <span className="font-medium">{analytics.items.wardrobe}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>On Rack:</span>
                  <span className="font-medium text-blue-600">{analytics.items.rack}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sold:</span>
                  <span className="font-medium text-green-600">{analytics.items.sold}</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total:</span>
                  <span>{analytics.items.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue Breakdown
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Platform Fees:</span>
                  <span className="font-medium text-primary">€{analytics.transactions.platformFees.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Seller Earnings:</span>
                  <span className="font-medium text-green-600">€{analytics.transactions.sellerEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Hanger Revenue:</span>
                  <span className="font-medium text-blue-600">€{analytics.overview.totalHangerRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Total Revenue:</span>
                  <span>€{analytics.transactions.totalRevenue.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
