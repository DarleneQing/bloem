import { requireAdminServer } from "@/lib/auth/utils";
import { AdminDashboardStats } from "@/components/admin/AdminDashboardStats";
import { AdminQuickActions } from "@/components/admin/AdminQuickActions";

export default async function AdminDashboardPage() {
  // Ensure only admins can access this page
  await requireAdminServer();

  return (
    <div className="container mx-auto max-w-6xl py-6 md:py-8 px-4">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-primary">Admin Dashboard</h1>
      </div>

      <div className="space-y-8">
        {/* Admin Quick Actions */}
        <AdminQuickActions />

        {/* Dashboard Statistics */}
        <AdminDashboardStats />
      </div>
    </div>
  );
}
