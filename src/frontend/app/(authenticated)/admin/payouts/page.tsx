import Link from "next/link";
import { requireAdminServer } from "@/lib/auth/utils";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

export default async function AdminPayoutsPage() {
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
        <h1 className="text-3xl md:text-4xl font-black text-primary">Payout Management</h1>
        <p className="text-muted-foreground mt-2">
          Process, track, and manage seller payouts and transactions
        </p>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
          <CreditCard className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-primary mb-4">Coming Soon</h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
          Payout Management feature will be available in a future update. 
          Process seller payments, track transactions, and manage financial operations.
        </p>
      </div>
    </div>
  );
}
