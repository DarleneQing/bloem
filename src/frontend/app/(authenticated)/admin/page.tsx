import { requireAdminServer } from "@/lib/auth/utils";
import { AdminDashboardStats } from "@/components/admin/AdminDashboardStats";

export default async function AdminDashboardPage() {
  const profile = await requireAdminServer();
  const adminName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Admin";

  return (
    <div className="container mx-auto max-w-3xl px-4 py-5 pb-8 md:max-w-5xl md:py-8">
      <AdminDashboardStats
        adminName={adminName}
        adminAvatarUrl={profile.avatar_url}
      />
    </div>
  );
}
