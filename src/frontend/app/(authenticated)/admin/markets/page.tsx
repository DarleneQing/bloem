import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminServer } from "@/lib/auth/utils";
import { AdminMarketManagement } from "@/components/admin/AdminMarketManagement";
import { Button } from "@/components/ui/button";

export default async function AdminMarketsPage() {
  // Ensure only admins can access this page
  await requireAdminServer();

  return (
    <div className="container mx-auto max-w-7xl py-6 md:py-8 px-4">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-primary">Market Management</h1>
        <p className="text-muted-foreground mt-2">
          Create, manage, and monitor all marketplace events
        </p>
      </div>

      <div className="space-y-6">
        <AdminMarketManagement />
      </div>
    </div>
  );
}
