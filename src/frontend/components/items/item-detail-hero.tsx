"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, MoreVertical, Shuffle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils";

interface ItemDetailHeroProps {
  images: string[];
  title: string;
  onDelete?: () => void;
  onUnlink?: () => void;
  showUnlink?: boolean;
  showDelete?: boolean;
  hideControls?: boolean;
  galleryLayout?: "default" | "compact";
}

const SWIPE_THRESHOLD_PX = 48;

const OVERLAY_CONTROL_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50";

const IMAGE_FRAME_CLASS =
  "relative w-full min-h-[42dvh] h-[45dvh] max-h-[min(85dvh,100vw)] overflow-hidden rounded-none bg-muted touch-pan-y md:h-[min(45dvh,32rem)] md:max-h-[32rem]";

const COMPACT_IMAGE_FRAME_CLASS =
  "relative w-full h-[30dvh] max-h-[30dvh] min-h-0 overflow-hidden rounded-none bg-muted touch-pan-y";

function useSwipeNavigation(
  onNext: () => void,
  onPrev: () => void,
  enabled: boolean
) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;
      didSwipeRef.current = false;
      startRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !startRef.current) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;
      startRef.current = null;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(deltaX) < Math.abs(deltaY)) return;

      didSwipeRef.current = true;
      if (deltaX < 0) {
        onNext();
      } else {
        onPrev();
      }
    },
    [enabled, onNext, onPrev]
  );

  return { onTouchStart, onTouchEnd, didSwipeRef };
}

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
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-4">
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

interface GalleryImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

function GalleryImage({ src, alt, priority, className }: GalleryImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      priority={priority}
      sizes="(max-width: 768px) 100vw, 672px"
    />
  );
}

export function ItemDetailHero({
  images,
  title,
  onDelete,
  onUnlink,
  showUnlink,
  showDelete,
  hideControls = false,
  galleryLayout = "default",
}: ItemDetailHeroProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const safeImages = images.length > 0 ? images : [];
  const hasMultiple = safeImages.length > 1;
  const safeIndex = safeImages.length > 0 ? Math.min(index, safeImages.length - 1) : 0;
  const current = safeImages[safeIndex];

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % safeImages.length);
  }, [safeImages.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const heroSwipe = useSwipeNavigation(goNext, goPrev, hasMultiple);
  const isCompactGallery = galleryLayout === "compact";
  const frameClass = isCompactGallery ? COMPACT_IMAGE_FRAME_CLASS : IMAGE_FRAME_CLASS;

  function openLightbox() {
    if (heroSwipe.didSwipeRef.current) {
      heroSwipe.didSwipeRef.current = false;
      return;
    }
    setLightboxOpen(true);
  }

  if (safeImages.length === 0) {
    return (
      <div className="relative w-full">
        {!hideControls && (
          <HeroControls
            showUnlink={showUnlink}
            showDelete={showDelete}
            onUnlink={onUnlink}
            onDelete={onDelete}
          />
        )}
        <div className={frameClass} />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {!hideControls && (
        <HeroControls
          showUnlink={showUnlink}
          showDelete={showDelete}
          onUnlink={onUnlink}
          onDelete={onDelete}
        />
      )}

      <div
        role="button"
        tabIndex={0}
        className={cn(frameClass, "block cursor-zoom-in text-left")}
        onClick={openLightbox}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openLightbox();
          }
        }}
        onTouchStart={heroSwipe.onTouchStart}
        onTouchEnd={heroSwipe.onTouchEnd}
        aria-label={`View full image: ${title}`}
      >
        <GalleryImage src={current} alt={title} priority />

        {hasMultiple && isCompactGallery && (
          <button
            type="button"
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition-colors hover:bg-white"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
          </button>
        )}

        {hasMultiple && isCompactGallery && (
          <span className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
            {safeIndex + 1} / {safeImages.length}
          </span>
        )}

        {hasMultiple && !isCompactGallery && (
          <button
            type="button"
            className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            aria-label="Next image"
          >
            {hideControls ? (
              <span>
                {safeIndex + 1} / {safeImages.length}
              </span>
            ) : (
              <>
                <Shuffle className="h-4 w-4" />
                {safeIndex + 1}/{safeImages.length}
              </>
            )}
          </button>
        )}
      </div>

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={safeImages}
        title={title}
        index={safeIndex}
        onIndexChange={setIndex}
      />
    </div>
  );
}
