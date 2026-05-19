"use client";

import { Bookmark } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toggleMarketFavorite } from "@/features/markets/actions";
import { cn } from "@/lib/utils";

interface Props {
  marketId: string;
  initialFavorited: boolean;
  onFavoriteChange?: (marketId: string, favorited: boolean) => void;
}

export function MarketBookmarkButton({
  marketId,
  initialFavorited,
  onFavoriteChange,
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isPending) return;

      setFavorited((prev) => !prev);

      startTransition(async () => {
        const result = await toggleMarketFavorite(marketId);
        if (result.error) {
          setFavorited((prev) => !prev);
        } else if (result.data) {
          setFavorited(result.data.favorited);
          onFavoriteChange?.(marketId, result.data.favorited);
        }
      });
    },
    [marketId, isPending, onFavoriteChange]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
        "hover:bg-primary/10 active:scale-90",
        isPending && "pointer-events-none opacity-60"
      )}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Bookmark
        className={cn(
          "h-5 w-5 transition-colors duration-200",
          favorited
            ? "fill-primary text-primary"
            : "fill-none text-muted-foreground/50 hover:text-muted-foreground"
        )}
      />
    </button>
  );
}
