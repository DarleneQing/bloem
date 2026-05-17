import Image from "next/image";
import { Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog";
import { ProfileEditableField } from "@/components/profile/profile-editable-field";
import { ProfileInfoRow } from "@/components/profile/profile-info-row";
import { ProfileSettingsSection } from "@/components/profile/profile-settings-section";
import { ProfileSignOutButton } from "@/components/profile/profile-sign-out-button";
import type { ProfileSellerStats } from "@/features/profile/queries";
import type { ProfileWithStatus } from "@/types/database";
import { cn } from "@/lib/utils";

interface ProfilePageLayoutProps {
  profile: ProfileWithStatus;
  isAdmin: boolean;
  stats: ProfileSellerStats;
}

function formatEarnings(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function VerifiedBadge({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-accent",
        className
      )}
      aria-hidden
    >
      <Check className={cn("h-3.5 w-3.5 text-white", iconClassName)} strokeWidth={3} />
    </span>
  );
}

export function ProfilePageLayout({ profile, isAdmin, stats }: ProfilePageLayoutProps) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  return (
    <div className="mx-auto w-full max-w-lg pb-8">
      <div className="relative">
        <div className="relative h-44 w-full overflow-hidden sm:h-48">
          <Image
            src="/assets/images/profile-page-bg.png"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
        </div>

        <div className="relative -mt-5 overflow-visible rounded-t-3xl bg-background px-4 pb-4 pt-6 shadow-[0_-6px_24px_rgba(107,34,177,0.06)] sm:-mt-6">
          <div className="absolute right-4 top-4 z-20">
            <ProfileEditDialog profile={profile} />
          </div>

          <div className="flex items-center gap-3 -mt-12 pr-12 sm:-mt-14 sm:pr-14">
            <Avatar className="z-10 h-24 w-24 shrink-0 border-4 border-background shadow-md">
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={fullName} />
              ) : null}
              <AvatarFallback className="bg-secondary/30 text-xl font-bold text-primary">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 pt-3 sm:pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
                  {fullName}
                </h1>
                {profile.isActiveSeller && <VerifiedBadge />}
              </div>
              {profile.isActiveSeller && (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand-accent">
                  <VerifiedBadge className="h-[18px] w-[18px]" iconClassName="h-3 w-3" />
                  <span>Verified Seller</span>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="space-y-5 bg-background px-4 pt-6">
        <section>
          <h2 className="mb-4 text-base font-bold text-foreground">Personal Info</h2>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm divide-y divide-border/80">
            <ProfileInfoRow label="Email" value={profile.email} />
            <ProfileEditableField
              label="Phone"
              value={profile.phone}
              field="phone"
              placeholder="+31 6 12345678"
            />
            <ProfileEditableField
              label="Address"
              value={profile.address}
              field="address"
              placeholder="Street, city, postal code"
            />
          </div>
        </section>

        <section className="rounded-2xl border bg-card py-5 shadow-sm">
          <div className="grid grid-cols-3 divide-x">
            <StatCell label="Items Uploaded" value={String(stats.itemsUploaded)} />
            <StatCell label="Items Sold" value={String(stats.itemsSold)} />
            <StatCell label="Total Earnings" value={formatEarnings(stats.totalEarnings)} />
          </div>
        </section>

        <ProfileSettingsSection profile={profile} isAdmin={isAdmin} />

        <ProfileSignOutButton />
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-2 text-center">
      <span className="text-xl font-bold text-primary leading-tight">{value}</span>
      <span className="mt-1 text-[11px] leading-snug text-muted-foreground">{label}</span>
    </div>
  );
}
