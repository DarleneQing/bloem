import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="hidden md:block sticky top-0 z-40 border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
          <Image
            src="/assets/images/logo-transparent.png"
            alt="Bloem"
            width={140}
            height={40}
            className="h-9 md:h-11 w-auto"
            priority
          />
        </Link>
        
        {/* Desktop navigation - hidden on mobile since we have bottom nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/explore" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Explore
          </Link>
          <Link 
            href="/markets" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Markets
          </Link>
          <Link 
            href="/wardrobe" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Wardrobe
          </Link>
          <Link 
            href="/profile" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}

