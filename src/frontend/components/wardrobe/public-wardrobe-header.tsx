import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PublicWardrobeShareButton } from "@/components/wardrobe/public-wardrobe-share-button";
import { PublicWardrobeActions } from "@/components/wardrobe/public-wardrobe-actions";
import type { PublicWardrobeStats } from "@/features/items/queries";
import { cn } from "@/lib/utils";

interface PublicWardrobeHeaderProps {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  memberSince: string;
  isActiveSeller: boolean;
  isOwnProfile: boolean;
  shareUrl: string;
  stats: PublicWardrobeStats;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-accent",
        className
      )}
      aria-hidden
    >
      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
    </span>
  );
}

export function PublicWardrobeHeader({
  firstName,
  lastName,
  avatarUrl,
  memberSince,
  isActiveSeller,
  isOwnProfile,
  shareUrl,
  stats,
}: PublicWardrobeHeaderProps) {
  const fullName = `${firstName} ${lastName}`.trim();
  const memberSinceLabel = new Date(memberSince).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const soldDisplay =
    stats.soldCount != null ? String(stats.soldCount) : "—";

  return (
    <div className="relative -mx-4 md:mx-0 md:overflow-hidden md:rounded-t-3xl">
      <div className="relative h-40 w-full sm:h-44">
        <Image
          src="/assets/images/profile-page-bg.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-3">
          <Link
            href="/home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <PublicWardrobeShareButton title={`${fullName}'s Wardrobe`} url={shareUrl} />
        </div>
      </div>

      <div className="relative -mt-5 overflow-visible rounded-t-[2rem] bg-background px-4 pb-5 pt-6 shadow-[0_-6px_24px_rgba(107,34,177,0.06)] sm:-mt-6">
        <div className="flex items-start gap-3 -mt-12 sm:-mt-14">
          <Avatar className="z-10 h-24 w-24 shrink-0 border-4 border-background shadow-md">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
            <AvatarFallback className="bg-secondary/30 text-xl font-bold text-primary">
              {getInitials(firstName, lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 pt-4 sm:pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
                {fullName}
              </h1>
              {isActiveSeller && <VerifiedBadge />}
            </div>

            {isActiveSeller && (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand-accent">
                <VerifiedBadge className="h-[18px] w-[18px]" />
                <span>Verified Seller</span>
              </p>
            )}

            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Member since {memberSinceLabel}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "mt-5 grid divide-x rounded-2xl border bg-card py-4 shadow-sm",
            isActiveSeller ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          <StatCell label="items" value={String(stats.itemCount)} />
          <StatCell label="Sold" value={soldDisplay} />
          {isActiveSeller && (
            <StatCell
              label="Seller Rating"
              value="—"
              icon={
                <Star className="h-4 w-4 fill-brand-accent text-brand-accent" />
              }
            />
          )}
        </div>

        <div className="mt-4">
          <PublicWardrobeActions isOwnProfile={isOwnProfile} />
        </div>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-2 text-center">
      <span className="flex items-center gap-1 text-xl font-bold leading-tight text-primary tabular-nums">
        {value}
        {icon}
      </span>
      <span className="mt-1 text-[11px] leading-snug text-muted-foreground">{label}</span>
    </div>
  );
}
