import { requireAdminServer } from "@/lib/auth/utils";
import { AdminPayoutManagement } from "@/components/admin/AdminPayoutManagement";

export default async function AdminPayoutsPage() {
  await requireAdminServer();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="hidden md:block mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-primary">
          Payout Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Process, track, and manage seller payouts and transactions
        </p>
      </div>

      <AdminPayoutManagement />
    </div>
  );
}
