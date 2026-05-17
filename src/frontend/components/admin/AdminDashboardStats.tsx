"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowLeft,
  DollarSign,
  Package,
  QrCode,
  Sprout,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChartPoint {
  label: string;
  value: number;
}

interface ActivityItem {
  id: string;
  type: "user" | "item" | "transaction";
  title: string;
  subtitle: string;
  imageUrl: string | null;
  createdAt: string;
}

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalMarkets: number;
    totalItems: number;
    totalRevenue: number;
    sellerEarnings: number;
    totalQrCodes: number;
  };
  markets: {
    active: number;
  };
  growth: {
    users: { growthRate: number };
    items: { growthRate: number };
    revenue: { growthRate: number };
    markets: { growthRate: number };
  };
  charts: {
    revenue: {
      total: number;
      growthRate: number;
      series: ChartPoint[];
    };
    users: {
      total: number;
      growthRate: number;
      series: ChartPoint[];
    };
  };
  recentActivity: ActivityItem[];
}

interface AdminDashboardStatsProps {
  adminName: string;
  adminAvatarUrl: string | null;
}

function formatGrowth(rate: number) {
  const prefix = rate >= 0 ? "+" : "";
  return `${prefix}${rate}%`;
}

function formatCurrency(value: number) {
  return `CHF ${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

const CHART_PERIOD_SELECT_TRIGGER =
  "h-6 max-w-[3.25rem] shrink-0 gap-0 border-0 bg-transparent px-0 py-0 text-[10px] font-medium text-muted-foreground shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [&_svg]:h-3 [&_svg]:w-3";

const CHART_PERIOD_SELECT_CONTENT = "min-w-[5.5rem] rounded-lg p-0.5 shadow-md";

const CHART_PERIOD_SELECT_ITEM = "py-1.5 pl-7 pr-2 text-xs";

function TrendBadge({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        value >= 0 ? "text-brand-accent" : "text-destructive"
      )}
    >
      <TrendingUp className={cn("h-3 w-3", value < 0 && "rotate-180")} />
      {formatGrowth(value)}
    </span>
  );
}

function FinanceLineChart({ series }: { series: ChartPoint[] }) {
  const maxValue = Math.max(...series.map((point) => point.value), 1);
  const width = 280;
  const height = 120;
  const padding = 8;
  const points = series.map((point, index) => {
    const x =
      padding +
      (index / Math.max(series.length - 1, 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      (point.value / maxValue) * (height - padding * 2);
    return { x, y };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-28 w-full"
      role="img"
      aria-label="Revenue trend chart"
    >
      <polyline
        fill="none"
        stroke="hsl(var(--brand-purple))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
      />
      {points.map((point, index) => (
        <circle
          key={`${point.x}-${index}`}
          cx={point.x}
          cy={point.y}
          r="3.5"
          fill="hsl(var(--brand-purple))"
        />
      ))}
    </svg>
  );
}

function UsersBarChart({ series }: { series: ChartPoint[] }) {
  const maxValue = Math.max(...series.map((point) => point.value), 1);

  return (
    <div
      className="flex h-28 items-end justify-between gap-2"
      role="img"
      aria-label="Weekly user signups chart"
    >
      {series.map((point, index) => (
        <div key={`${point.label}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div
            className="w-full max-w-8 rounded-t-lg bg-brand-purple/80"
            style={{
              height: `${Math.max((point.value / maxValue) * 88, 6)}px`,
            }}
          />
          <span className="text-[10px] font-medium text-muted-foreground">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface StatCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  growth: number;
}

function StatCard({ icon: Icon, label, value, growth }: StatCardProps) {
  return (
    <Card className="min-w-0 overflow-hidden rounded-2xl border-border/60 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-lavender/25 text-brand-purple">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <p className="min-w-0 flex-1 text-[11px] font-bold leading-tight tracking-tight text-foreground sm:text-xs">
            {value}
          </p>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground sm:text-xs">
          {label}
        </p>
        <div className="mt-2">
          <TrendBadge value={growth} />
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityAvatar({ item }: { item: ActivityItem }) {
  if (item.imageUrl) {
    return (
      <Image
        src={item.imageUrl}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-lavender/30 text-brand-purple">
      {item.type === "user" ? (
        <Users className="h-4 w-4" />
      ) : item.type === "item" ? (
        <Package className="h-4 w-4" />
      ) : (
        <DollarSign className="h-4 w-4" />
      )}
    </div>
  );
}

export function AdminDashboardStats({
  adminName,
  adminAvatarUrl,
}: AdminDashboardStatsProps) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/profile");
  }, [router]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/analytics");
        const data = await response.json();

        if (data.success) {
          const payload = data.data as AnalyticsData;
          setAnalytics({
            ...payload,
            charts: payload.charts ?? {
              revenue: {
                total: payload.overview.totalRevenue,
                growthRate: payload.growth.revenue.growthRate,
                series: [],
              },
              users: {
                total: payload.overview.totalUsers,
                growthRate: payload.growth.users.growthRate,
                series: [],
              },
            },
            recentActivity: payload.recentActivity ?? [],
          });
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

  const monthStartLabel = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toLocaleString("default", { month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 min-h-0 min-w-0 shrink-0 rounded-full p-0 active:scale-100"
          onClick={handleBack}
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 text-brand-purple" />
        </Button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              <span className="flex items-center gap-2">
                Welcome back,
                <Sprout className="h-5 w-5 text-brand-accent" aria-hidden />
              </span>
              <span className="mt-0.5 block">{adminName}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground md:text-base">
              Here&apos;s what&apos;s happening on{" "}
              <span className="font-bold text-primary">bloem</span>.
            </p>
          </div>
          <Avatar className="h-12 w-12 shrink-0 border-2 border-brand-lavender/40">
            <AvatarImage src={adminAvatarUrl ?? undefined} alt={adminName} />
            <AvatarFallback className="bg-brand-lavender/30 text-sm font-semibold text-brand-purple">
              {getInitials(adminName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {loading ? (
        <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-4">
                <SkeletonBlock className="h-9 w-9 rounded-xl" />
                <SkeletonBlock className="mt-4 h-7 w-24" />
                <SkeletonBlock className="mt-2 h-4 w-20" />
                <SkeletonBlock className="mt-3 h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <Activity className="h-4 w-4" />
            <span className="font-medium">Error loading analytics</span>
          </div>
          <p className="mt-1 text-sm text-destructive/80">{error}</p>
        </div>
      ) : analytics ? (
        <>
          <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatCurrency(analytics.overview.totalRevenue)}
              growth={analytics.growth.revenue.growthRate}
            />
            <StatCard
              icon={Wallet}
              label="Total Payouts"
              value={formatCurrency(analytics.overview.sellerEarnings)}
              growth={analytics.growth.revenue.growthRate}
            />
            <StatCard
              icon={Users}
              label="Active Users"
              value={analytics.overview.totalUsers.toLocaleString()}
              growth={analytics.growth.users.growthRate}
            />
            <StatCard
              icon={Store}
              label="Active Markets"
              value={analytics.markets.active.toLocaleString()}
              growth={analytics.growth.markets.growthRate}
            />
            <StatCard
              icon={Package}
              label="Items Listed"
              value={analytics.overview.totalItems.toLocaleString()}
              growth={analytics.growth.items.growthRate}
            />
            <StatCard
              icon={QrCode}
              label="QR Links"
              value={analytics.overview.totalQrCodes.toLocaleString()}
              growth={0}
            />
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3">
            <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
              <CardContent className="min-w-0 p-3 sm:p-4 md:p-5">
                <div className="mb-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
                      Finance Overview
                    </h2>
                    <Select defaultValue="month">
                      <SelectTrigger
                        variant="inline"
                        className={CHART_PERIOD_SELECT_TRIGGER}
                      >
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent className={CHART_PERIOD_SELECT_CONTENT}>
                        <SelectItem value="month" className={CHART_PERIOD_SELECT_ITEM}>
                          Month
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight text-foreground sm:text-xl">
                      {formatCurrency(analytics.charts.revenue.total)}
                    </p>
                    <TrendBadge value={analytics.charts.revenue.growthRate} />
                  </div>
                </div>
                <FinanceLineChart series={analytics.charts.revenue.series} />
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>{monthStartLabel}</span>
                  <span>Today</span>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 rounded-2xl border-border/60 shadow-sm">
              <CardContent className="min-w-0 p-3 sm:p-4 md:p-5">
                <div className="mb-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
                      App Analytics
                    </h2>
                    <Select defaultValue="week">
                      <SelectTrigger
                        variant="inline"
                        className={CHART_PERIOD_SELECT_TRIGGER}
                      >
                        <SelectValue placeholder="Week" />
                      </SelectTrigger>
                      <SelectContent className={CHART_PERIOD_SELECT_CONTENT}>
                        <SelectItem value="week" className={CHART_PERIOD_SELECT_ITEM}>
                          Week
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight text-foreground sm:text-xl">
                      {analytics.charts.users.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                    <TrendBadge value={analytics.charts.users.growthRate} />
                  </div>
                </div>
                <UsersBarChart series={analytics.charts.users.series} />
              </CardContent>
            </Card>
          </div>

          <AdminQuickActions />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
              <Link
                href="/admin/users"
                className="text-sm font-medium text-brand-purple hover:underline"
              >
                View all
              </Link>
            </div>
            <Card className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="divide-y divide-border/70 p-0">
                {analytics.recentActivity.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    No recent activity yet.
                  </p>
                ) : (
                  analytics.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3.5"
                    >
                      <ActivityAvatar item={item} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {item.subtitle}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}
