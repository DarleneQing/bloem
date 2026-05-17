import { requireAdminServer } from "@/lib/auth/utils";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";

export default async function AdminUsersPage() {
  await requireAdminServer();

  return (
    <div className="min-h-screen bg-brand-ivory/40 px-4 py-4 md:py-6">
      <AdminUserManagement />
    </div>
  );
}
