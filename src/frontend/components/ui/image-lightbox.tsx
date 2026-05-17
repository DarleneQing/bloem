"use client";

import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Shuffle, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 48;

const OVERLAY_CONTROL_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50";

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
      unoptimized
      className={cn("object-cover", className)}
      priority={priority}
      sizes="(max-width: 768px) 100vw, 672px"
    />
  );
}

export interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  title: string;
  index: number;
  onIndexChange: Dispatch<SetStateAction<number>>;
}

export function ImageLightbox({
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
