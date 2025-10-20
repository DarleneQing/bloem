import { isActiveSellerServer } from "@/lib/auth/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SellerGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export async function SellerGate({ children, fallback }: SellerGateProps) {
  const isActiveSeller = await isActiveSellerServer();

  if (!isActiveSeller) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Become a Seller</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            To access this feature, you need to activate your seller account by providing your
            IBAN information.
          </p>
          <Button asChild>
            <Link href="/profile">Activate Seller Account</Link>
          </Button>
        </div>
      )
    );
  }

  return <>{children}</>;
}

