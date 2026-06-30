import { Suspense } from "react";
import { getUserProfileServer, isAdminServer } from "@/lib/auth/utils";
import { getProfileSellerStats } from "@/features/profile/queries";
import { ProfilePageLayout } from "@/components/profile/profile-page-layout";
import { ProfileStripeReturn } from "@/components/profile/profile-stripe-return";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ activate?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const profile = await getUserProfileServer();
  const isAdmin = await isAdminServer();

  if (!profile) {
    return null;
  }

  const stats = await getProfileSellerStats();

  return (
    <>
      <Suspense fallback={null}>
        <ProfileStripeReturn />
      </Suspense>
      <ProfilePageLayout
        profile={profile}
        isAdmin={isAdmin}
        stats={stats}
        activateSeller={resolvedSearchParams.activate === "seller"}
      />
    </>
  );
}
