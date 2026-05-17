import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";

export function WardrobePageHeader() {
  return (
    <header className="flex items-center justify-between gap-3 mb-4 md:mb-6">
      <Link
        href="/home"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        aria-label="Back to home"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <h1 className="flex-1 text-center text-lg font-bold text-foreground sm:text-xl md:text-2xl">
        My Wardrobe
      </h1>

      <Link
        href="/profile"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        aria-label="Profile and notifications"
      >
        <Bell className="h-5 w-5" />
      </Link>
    </header>
  );
}
