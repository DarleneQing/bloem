"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, CreditCard, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { WardrobePrivacyToggle } from "@/components/profile/WardrobePrivacyToggle";
import { ProfileForm } from "@/components/profile/profile-form";
import type { ProfileWithStatus } from "@/types/database";

export type SettingsSectionId = "seller" | "payment" | "admin" | null;

interface ProfileSettingsNavProps {
  profile: ProfileWithStatus;
  isAdmin: boolean;
  openSection?: SettingsSectionId;
  onOpenSectionChange?: (id: SettingsSectionId) => void;
  showActivationForm?: boolean;
  onShowActivationFormChange?: (show: boolean) => void;
}

export function ProfileSettingsNav({
  profile,
  isAdmin,
  openSection: openSectionProp,
  onOpenSectionChange,
  showActivationForm = false,
  onShowActivationFormChange,
}: ProfileSettingsNavProps) {
  const [internalOpenSection, setInternalOpenSection] = useState<SettingsSectionId>(null);
  const openSection = openSectionProp ?? internalOpenSection;

  const setOpenSection = (id: SettingsSectionId) => {
    if (onOpenSectionChange) {
      onOpenSectionChange(id);
    } else {
      setInternalOpenSection(id);
    }
  };

  const toggle = (id: SettingsSectionId) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm divide-y divide-border/80">
      <NavRow
        icon={Settings}
        label="Seller settings"
        expanded={openSection === "seller"}
        onToggle={() => toggle("seller")}
      />
      {openSection === "seller" && (
        <div className="px-4 py-4">
          <WardrobePrivacyToggle profile={profile} />
        </div>
      )}

      <NavRow
        icon={CreditCard}
        label="Payment & payouts"
        expanded={openSection === "payment"}
        onToggle={() => toggle("payment")}
      />
      {openSection === "payment" && (
        <div className="px-4 py-4">
          <ProfileForm
            profile={profile}
            embedded
            showActivationForm={showActivationForm}
            onShowActivationFormChange={onShowActivationFormChange}
          />
        </div>
      )}

      {isAdmin && (
        <>
          <Link
            href="/admin"
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20 text-primary">
              <Shield className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">Admin dashboard</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </>
      )}
    </div>
  );
}

function NavRow({
  icon: Icon,
  label,
  expanded,
  onToggle,
}: {
  icon: typeof Settings;
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40"
      )}
      aria-expanded={expanded}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <ChevronRight
        className={cn(
          "h-5 w-5 text-muted-foreground transition-transform",
          expanded && "rotate-90"
        )}
      />
    </button>
  );
}
