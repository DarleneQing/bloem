import Link from "next/link";
import { ScanLine, Shirt, ShoppingCart } from "lucide-react";

const QUICK_ACTIONS = [
  {
    href: "/scan",
    title: "Scan an item",
    description: "View details from a QR code",
    icon: ScanLine,
  },
  {
    href: "/wardrobe",
    title: "My wardrobe",
    description: "Manage items you are selling",
    icon: Shirt,
  },
  {
    href: "/cart",
    title: "Shopping cart",
    description: "Reserved items and checkout",
    icon: ShoppingCart,
  },
] as const;

interface HomeQuickActionsProps {
  firstName: string;
}

export function HomeQuickActions({ firstName }: HomeQuickActionsProps) {
  return (
    <section className="mb-2">
      <p className="mb-3 text-sm text-muted-foreground">Hi {firstName}, quick access</p>
      <div className="grid gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">{action.title}</span>
                <span className="text-sm text-muted-foreground">{action.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
