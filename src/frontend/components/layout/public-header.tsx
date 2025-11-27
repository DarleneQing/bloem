"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

interface PublicHeaderProps {
  user?: User | null;
  sticky?: boolean;
  variant?: "default" | "transparent";
}

export function PublicHeader({ user, sticky = false, variant = "default" }: PublicHeaderProps) {
  const headerClasses = sticky
    ? "border-b bg-card/80 backdrop-blur-md sticky top-0 z-50"
    : "border-b bg-card";

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Image
            src="/assets/images/brand-transparent.png"
            alt="Bloem"
            width={140}
            height={40}
            className="h-9 md:h-11 w-auto"
            priority
          />
        </Link>
        {!user && (
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="font-medium">
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
            <Button asChild variant="default" size="sm" className="hidden sm:inline-flex font-medium">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

