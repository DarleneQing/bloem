import Link from "next/link";
import { Plus } from "lucide-react";

export function WardrobeFab() {
  return (
    <Link
      href="/wardrobe/upload"
      className="md:hidden fixed bottom-20 left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
      aria-label="Upload item"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );
}
