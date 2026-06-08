import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { requireAdminServer } from "@/lib/auth/utils";
import { Button } from "@/components/ui/button";
import { QRBatchManagement } from "@/components/admin/QRBatchManagement";
import { QRCreateBatchTrigger } from "@/components/admin/qr-create-batch-trigger";

export default async function AdminQRCodesPage() {
  await requireAdminServer();

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-brand-ivory/60 px-4 py-4 md:max-w-2xl md:py-6 lg:max-w-3xl">
      <header className="mb-5 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-full">
          <Link href="/admin" aria-label="Back to admin dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold text-foreground">
          QR Code Management
        </h1>
        <div className="flex shrink-0 items-center gap-1">
          <QRCreateBatchTrigger />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            aria-label="Export (use batch actions below)"
            disabled
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <QRBatchManagement />
    </div>
  );
}
