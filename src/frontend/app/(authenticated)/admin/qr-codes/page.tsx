import Link from "next/link";
import { requireAdminServer } from "@/lib/auth/utils";
import { Button } from "@/components/ui/button";
import { QRBatchManagement } from "@/components/admin/QRBatchManagement";

export default async function AdminQRCodesPage() {
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
        <h1 className="text-3xl md:text-4xl font-black text-primary">QR Code Management</h1>
        <p className="text-muted-foreground mt-2">
          Generate, manage, and track QR codes across the platform
        </p>
      </div>

      <QRBatchManagement />
    </div>
  );
}


