import Image from "next/image";
import Link from "next/link";
import { Bell, Heart } from "lucide-react";

export function HomePageHeader() {
  return (
    <header className="mb-4 flex items-center justify-between gap-3">
      <Link href="/home" className="shrink-0" aria-label="Bloem home">
        <Image
          src="/assets/images/logo-transparent.png"
          alt="Bloem"
          width={108}
          height={32}
          className="h-8 w-auto"
          priority
        />
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/profile"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          aria-label="Notifications and profile"
        >
          <Bell className="h-5 w-5" />
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-accent ring-2 ring-background"
            aria-hidden
          />
        </Link>
        <Link
          href="/markets"
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          aria-label="Browse markets"
        >
          <Heart className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
