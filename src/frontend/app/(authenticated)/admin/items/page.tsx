import Link from "next/link";
import { requireAdminServer } from "@/lib/auth/utils";
import { AdminItemManagement } from "@/components/admin/AdminItemManagement";
import { Button } from "@/components/ui/button";

export default async function AdminItemsPage() {
  // Ensure only admins can access this page
  await requireAdminServer();

  return (
    <div className="container mx-auto max-w-7xl py-6 md:py-8 px-4">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">← Back to Dashboard</Link>
          </Button>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-primary">Item Management</h1>
        <p className="text-muted-foreground mt-2">
          Oversee and manage all platform items, track analytics, and monitor item status
        </p>
      </div>

      <div className="space-y-6">
        <AdminItemManagement />
      </div>
    </div>
  );
}


