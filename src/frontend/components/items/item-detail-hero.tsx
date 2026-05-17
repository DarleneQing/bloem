"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ItemDetailHeroProps {
  images: string[];
  title: string;
  onDelete?: () => void;
  onUnlink?: () => void;
  showUnlink?: boolean;
  showDelete?: boolean;
}

const OVERLAY_CONTROL_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50";

const IMAGE_FRAME_CLASS =
  "relative mx-auto h-56 w-full max-w-[280px] overflow-hidden rounded-2xl bg-muted sm:h-64 sm:max-w-xs md:h-72 md:max-w-sm";

function HeroControls({
  showUnlink,
  showDelete,
  onUnlink,
  onDelete,
}: {
  showUnlink?: boolean;
  showDelete?: boolean;
  onUnlink?: () => void;
  onDelete?: () => void;
}) {
  const hasMenu = showDelete || showUnlink;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between">
      <Link
        href="/wardrobe"
        className={`pointer-events-auto ${OVERLAY_CONTROL_CLASS}`}
        aria-label="Back to wardrobe"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {hasMenu ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={`pointer-events-auto ${OVERLAY_CONTROL_CLASS}`}
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-2">
            {showUnlink && onUnlink && (
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onUnlink}>
                Unlink from rack
              </Button>
            )}
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                Delete item
              </Button>
            )}
          </PopoverContent>
        </Popover>
      ) : (
        <span className="h-10 w-10 shrink-0" aria-hidden />
      )}
    </div>
  );
}

export function ItemDetailHero({
  images,
  title,
  onDelete,
  onUnlink,
  showUnlink,
  showDelete,
}: ItemDetailHeroProps) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative w-full">
        <HeroControls
          showUnlink={showUnlink}
          showDelete={showDelete}
          onUnlink={onUnlink}
          onDelete={onDelete}
        />
        <div className={IMAGE_FRAME_CLASS} />
      </div>
    );
  }

  const safeImages = images;
  const current = safeImages[Math.min(index, safeImages.length - 1)];

  function goNext() {
    setIndex((i) => (i + 1) % safeImages.length);
  }

  function goPrev() {
    setIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }

  return (
    <div className="relative w-full">
      <HeroControls
        showUnlink={showUnlink}
        showDelete={showDelete}
        onUnlink={onUnlink}
        onDelete={onDelete}
      />

      <div className={IMAGE_FRAME_CLASS}>
        <Image src={current} alt={title} fill className="object-cover" priority />

        {safeImages.length > 1 && (
          <>
            <button
              type="button"
              className="absolute inset-y-0 left-0 z-10 w-1/3"
              onClick={goPrev}
              aria-label="Previous image"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 z-10 w-1/3"
              onClick={goNext}
              aria-label="Next image"
            />
          </>
        )}

        {safeImages.length > 1 && (
          <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {index + 1}/{safeImages.length}
          </span>
        )}
      </div>
    </div>
  );
}
