"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { ProfileSettingsNav, type SettingsSectionId } from "@/components/profile/profile-settings-nav";
import { VerifyToBeSellerBanner } from "@/components/profile/verify-to-be-seller-banner";
import type { ProfileWithStatus } from "@/types/database";

interface ProfileSettingsSectionProps {
  profile: ProfileWithStatus;
  isAdmin: boolean;
}

export function ProfileSettingsSection({ profile, isAdmin }: ProfileSettingsSectionProps) {
  const [openSection, setOpenSection] = useState<SettingsSectionId>(null);
  const [showActivationForm, setShowActivationForm] = useState(false);

  const handleVerify = useCallback(() => {
    setShowActivationForm(true);
    setOpenSection("payment");
    requestAnimationFrame(() => {
      document.getElementById("profile-settings")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  return (
    <>
      {profile.isActiveSeller ? (
        <section className="relative min-h-[88px] overflow-hidden rounded-2xl">
          <Image
            src="/assets/images/account-active-banner.png"
            alt=""
            fill
            className="object-cover object-right"
            sizes="(max-width: 512px) 100vw, 512px"
          />
          <div className="relative flex items-center gap-3 px-4 py-4 pr-28">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-accent shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">Seller Account Active</p>
              <p className="text-xs text-muted-foreground">You can list, sell and earn.</p>
            </div>
          </div>
        </section>
      ) : (
        <VerifyToBeSellerBanner onVerify={handleVerify} />
      )}

      <div id="profile-settings">
        <ProfileSettingsNav
          profile={profile}
          isAdmin={isAdmin}
          openSection={openSection}
          onOpenSectionChange={setOpenSection}
          showActivationForm={showActivationForm}
          onShowActivationFormChange={setShowActivationForm}
        />
      </div>
    </>
  );
}
