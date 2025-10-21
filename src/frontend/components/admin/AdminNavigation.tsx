"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Store, 
  Package, 
  QrCode, 
  CreditCard
} from "lucide-react";

export function AdminNavigation() {
  const adminLinks = [
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {adminLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}>
            <Button
              variant="outline"
              className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-semibold text-left">{link.label}</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                {link.description}
              </p>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
