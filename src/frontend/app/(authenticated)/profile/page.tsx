import { getUserProfileServer, isAdminServer } from "@/lib/auth/utils";
import { getProfileSellerStats } from "@/features/profile/queries";
import { ProfilePageLayout } from "@/components/profile/profile-page-layout";

export default async function ProfilePage() {
  const profile = await getUserProfileServer();
  const isAdmin = await isAdminServer();

  if (!profile) {
    return null;
  }

  const stats = await getProfileSellerStats();

  return <ProfilePageLayout profile={profile} isAdmin={isAdmin} stats={stats} />;
}
