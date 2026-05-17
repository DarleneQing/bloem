"use client";

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, MoreVertical, Shuffle, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ItemDetailHeroProps {
  images: string[];
  title: string;
  onDelete?: () => void;
  onUnlink?: () => void;
  showUnlink?: boolean;
  showDelete?: boolean;
  hideControls?: boolean;
}

const SWIPE_THRESHOLD_PX = 48;

const OVERLAY_CONTROL_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50";

const IMAGE_FRAME_CLASS =
  "relative w-full min-h-[42dvh] h-[45dvh] max-h-[min(85dvh,100vw)] overflow-hidden rounded-none bg-muted touch-pan-y md:h-[min(45dvh,32rem)] md:max-h-[32rem]";

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

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  title: string;
  index: number;
  onIndexChange: Dispatch<SetStateAction<number>>;
}

function ImageLightbox({
  open,
  onOpenChange,
  images,
  title,
  index,
  onIndexChange,
}: ImageLightboxProps) {
  const hasMultiple = images.length > 1;
  const safeIndex = Math.min(index, images.length - 1);
  const current = images[safeIndex];

  const goNext = useCallback(() => {
    onIndexChange((i) => (i + 1) % images.length);
  }, [images.length, onIndexChange]);

  const goPrev = useCallback(() => {
    onIndexChange((i) => (i - 1 + images.length) % images.length);
  }, [images.length, onIndexChange]);

  const swipe = useSwipeNavigation(goNext, goPrev, hasMultiple && open);

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] flex-col gap-0 border-0 bg-black/95 p-0 text-white sm:max-w-[100vw] [&>button.absolute]:hidden"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <DialogTitle className="sr-only">
          {title} — image {safeIndex + 1} of {images.length}
        </DialogTitle>

        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
          {hasMultiple ? (
            <span className="text-sm font-medium text-white/80">
              {safeIndex + 1} / {images.length}
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={OVERLAY_CONTROL_CLASS}
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <GalleryImage src={current} alt={`${title} — full size`} className="object-contain" />

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm hover:bg-black/60"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-sm hover:bg-black/60"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {hasMultiple && (
          <div className="flex shrink-0 items-center justify-center gap-4 px-4 py-6">
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              aria-label="Next image"
            >
              <Shuffle className="h-4 w-4" />
              Next photo
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
        <div className={IMAGE_FRAME_CLASS} />
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
        className={cn(IMAGE_FRAME_CLASS, "block cursor-zoom-in text-left")}
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

        {hasMultiple && (
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
