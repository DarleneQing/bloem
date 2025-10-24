"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Package, 
  QrCode, 
  CreditCard, 
  TrendingUp,
  Activity
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

    </div>
  );
}
