import { requireAdminServer } from "@/lib/auth/utils";
import { AdminDashboardStats } from "@/components/admin/AdminDashboardStats";
import { AdminNavigation } from "@/components/admin/AdminNavigation";

export default async function AdminDashboardPage() {
  // Ensure only admins can access this page
  await requireAdminServer();

  return (
    <div className="container mx-auto max-w-6xl py-6 md:py-8 px-4">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive platform management and analytics
        </p>
      </div>

      <div className="space-y-8">
        {/* Admin Navigation */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-primary mb-4">Admin Management</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Access all administrative functions and platform management tools.
          </p>
          <AdminNavigation />
        </div>

        {/* Dashboard Statistics */}
        <AdminDashboardStats />
      </div>
    </div>
  );
}
