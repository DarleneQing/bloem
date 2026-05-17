import { requireAdminServer } from "@/lib/auth/utils";
import { AdminItemManagement } from "@/components/admin/AdminItemManagement";

export default async function AdminItemsPage() {
  await requireAdminServer();

  return (
    <div className="min-h-screen bg-brand-ivory/80 px-4 py-4 md:py-6">
      <AdminItemManagement />
    </div>
  );
}
