"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Store, 
  Package, 
  QrCode, 
  CreditCard, 
  TrendingUp,
  Activity
} from "lucide-react";

export function AdminDashboardStats() {
  // Mock data - in real implementation, this would come from API calls
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      description: "Active platform users"
    },
    {
      title: "Active Markets",
      value: "8",
      change: "+2",
      changeType: "positive" as const,
      icon: Store,
      description: "Currently running markets"
    },
    {
      title: "Total Items",
      value: "5,678",
      change: "+156",
      changeType: "positive" as const,
      icon: Package,
      description: "Items in platform wardrobes"
    },
    {
      title: "QR Codes Generated",
      value: "2,345",
      change: "+89",
      changeType: "positive" as const,
      icon: QrCode,
      description: "QR codes created this month"
    },
    {
      title: "Total Transactions",
      value: "€12,456",
      change: "+€1,234",
      changeType: "positive" as const,
      icon: CreditCard,
      description: "Revenue this month"
    },
    {
      title: "Platform Activity",
      value: "98.5%",
      change: "+2.1%",
      changeType: "positive" as const,
      icon: Activity,
      description: "System uptime"
    }
  ];

  return (
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
  );
}
