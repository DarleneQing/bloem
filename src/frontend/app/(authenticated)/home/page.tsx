import Image from "next/image";
import Link from "next/link";
import { ScanLine, Shirt, ShoppingCart, Store } from "lucide-react";
import { getUserProfileServer } from "@/lib/auth/utils";

export default async function HomePage() {
  const profile = await getUserProfileServer();
  const firstName = profile?.first_name?.trim() || "there";

  return (
    <div className="container mx-auto max-w-lg py-6 md:py-8 px-4">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <Image
          src="/assets/images/logo-transparent.png"
          alt="Bloem"
          width={100}
          height={30}
          className="h-8 w-auto md:hidden"
          priority
        />
        <h1 className="text-3xl md:text-4xl font-black text-primary">Home</h1>
      </div>

      <p className="text-muted-foreground mb-8">
        Hi {firstName}, what would you like to do?
      </p>

      <div className="grid gap-3">
        <Link
          href="/markets"
          className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-primary">
            <Store className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-foreground">Browse markets</span>
            <span className="text-sm text-muted-foreground">Find pop-ups and events near you</span>
          </span>
        </Link>

        <Link
          href="/scan"
          className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-primary">
            <ScanLine className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-foreground">Scan an item</span>
            <span className="text-sm text-muted-foreground">View details from a QR code</span>
          </span>
        </Link>

        <Link
          href="/wardrobe"
          className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-primary">
            <Shirt className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-foreground">My wardrobe</span>
            <span className="text-sm text-muted-foreground">Manage items you are selling</span>
          </span>
        </Link>

        <Link
          href="/cart"
          className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-primary">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-foreground">Shopping cart</span>
            <span className="text-sm text-muted-foreground">Reserved items and checkout</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
