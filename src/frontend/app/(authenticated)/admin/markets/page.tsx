import { requireAdminServer } from "@/lib/auth/utils";
import { AdminMarketManagement } from "@/components/admin/AdminMarketManagement";

export default async function AdminMarketsPage() {
  await requireAdminServer();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-4 md:max-w-2xl md:py-6">
      <AdminMarketManagement />
    </div>
  );
}
