"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PublicWardrobeShareButtonProps {
  title: string;
  url: string;
}

export function PublicWardrobeShareButton({ title, url }: PublicWardrobeShareButtonProps) {
  const { toast } = useToast();

  async function handleShare() {
    const shareUrl =
      url || (typeof window !== "undefined" ? window.location.href : "");
    const shareData = { title, url: shareUrl };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Wardrobe link copied to your clipboard.",
      });
    } catch {
      toast({
        title: "Could not share",
        description: "Copy the link from your browser address bar instead.",
        variant: "destructive",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
      aria-label="Share wardrobe"
    >
      <Share2 className="h-5 w-5" />
    </button>
  );
}
