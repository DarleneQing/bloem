"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Store, 
  Package, 
  QrCode, 
  CreditCard,
  BarChart3
} from "lucide-react";

export function AdminQuickActions() {
  const adminLinks = [
    {
      href: "/admin",
      label: "Dashboard",
      description: "Overview and analytics",
      icon: BarChart3,
    },
    {
      href: "/admin/users",
      label: "User Management",
      description: "Manage user accounts and roles",
      icon: Users,
    },
    {
      href: "/admin/markets",
      label: "Market Management",
      description: "Create and manage markets",
      icon: Store,
    },
    {
      href: "/admin/items",
      label: "Item Management",
      description: "Oversee all platform items",
      icon: Package,
    },
    {
      href: "/admin/qr-codes",
      label: "QR Code Management",
      description: "Generate and manage QR codes",
      icon: QrCode,
    },
    {
      href: "/admin/payouts",
      label: "Payout Management",
      description: "Process and track payouts",
      icon: CreditCard,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-primary mb-4">Admin Management</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Access all administrative functions and platform management tools.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">{link.label}</h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
