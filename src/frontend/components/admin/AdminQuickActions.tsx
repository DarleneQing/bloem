"use client";

import Link from "next/link";
import { CreditCard, Package, QrCode, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    variant: "purple" as const,
  },
  {
    href: "/admin/markets",
    label: "Markets",
    icon: Store,
    variant: "purple" as const,
  },
  {
    href: "/admin/items",
    label: "Items",
    icon: Package,
    variant: "purple" as const,
  },
  {
    href: "/admin/qr-codes",
    label: "QR Codes",
    icon: QrCode,
    variant: "purple" as const,
  },
  {
    href: "/admin/payouts",
    label: "Payouts",
    icon: CreditCard,
    variant: "accent" as const,
  },
];

export function AdminQuickActions() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-5 gap-2 sm:gap-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isAccent = action.variant === "accent";

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 sm:h-16 sm:w-16",
                  isAccent
                    ? "bg-brand-accent text-foreground shadow-sm"
                    : "bg-brand-lavender/30 text-brand-purple"
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium text-foreground sm:text-sm">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
