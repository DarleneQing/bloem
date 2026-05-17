"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScanLine, Shirt, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Markets", href: "/markets", icon: Store },
  { name: "Scan", href: "/scan", icon: ScanLine },
  { name: "Wardrobe", href: "/wardrobe", icon: Shirt },
  { name: "Profile", href: "/profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-lg">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/scan"
              ? pathname === "/scan" ||
                pathname?.startsWith("/scan/") ||
                pathname?.startsWith("/qr/")
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors min-w-[60px] min-h-touch",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.25 : 2} />
              <span className={cn("text-xs leading-tight", isActive && "font-semibold")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
