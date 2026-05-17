"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PublicWardrobeActionsProps {
  isOwnProfile: boolean;
}

export function PublicWardrobeActions({ isOwnProfile }: PublicWardrobeActionsProps) {
  const { toast } = useToast();

  function showComingSoon(action: string) {
    toast({
      title: "Coming soon",
      description: `${action} will be available in a future update.`,
    });
  }

  if (isOwnProfile) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        type="button"
        className="h-11 rounded-full font-semibold"
        onClick={() => showComingSoon("Follow")}
      >
        Follow
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-full border-2 font-semibold"
        onClick={() => showComingSoon("Messaging")}
      >
        Message
      </Button>
    </div>
  );
}
