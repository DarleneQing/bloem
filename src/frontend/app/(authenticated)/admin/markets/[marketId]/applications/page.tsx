import { requireAdminServer } from "@/lib/auth/utils";
import { AdminMarketApplications } from "@/components/admin/AdminMarketApplications";

interface AdminMarketApplicationsPageProps {
  params: { marketId: string };
}

export default async function AdminMarketApplicationsPage({
  params,
}: AdminMarketApplicationsPageProps) {
  await requireAdminServer();

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-4 md:max-w-2xl md:py-6">
      <AdminMarketApplications marketId={params.marketId} />
    </div>
  );
}
