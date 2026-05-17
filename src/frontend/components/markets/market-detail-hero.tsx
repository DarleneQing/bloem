"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, Share2 } from "lucide-react";

interface MarketDetailHeroProps {
  imageUrl?: string | null;
  alt: string;
  isFull?: boolean;
}

const OVERLAY_BUTTON_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md transition-colors hover:bg-white";

export function MarketDetailHero({ imageUrl, alt, isFull }: MarketDetailHeroProps) {
  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: alt, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // User cancelled share or clipboard denied
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={imageUrl || "/assets/images/brand-transparent.png"}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {isFull && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-destructive px-4 py-1.5 text-sm font-semibold text-destructive-foreground">
              Market full
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-4">
          <Link href="/markets" className={OVERLAY_BUTTON_CLASS} aria-label="Back to markets">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <button type="button" className={OVERLAY_BUTTON_CLASS} aria-label="Save market">
              <Heart className="h-5 w-5" />
            </button>
            <button
              type="button"
              className={OVERLAY_BUTTON_CLASS}
              aria-label="Share market"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-7 left-5 z-30 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-white shadow-md">
        <Image
          src="/assets/images/logo-transparent.png"
          alt="Bloem"
          width={40}
          height={40}
          className="h-9 w-9 object-contain"
        />
      </div>
    </div>
  );
}
