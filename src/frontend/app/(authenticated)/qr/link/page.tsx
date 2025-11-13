import { redirect } from "next/navigation";
import { requireActiveSellerServer } from "@/lib/auth/utils";
import { QRCodeLinkingForm } from "@/components/qr-codes/QRCodeLinkingForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function QRLinkingPage() {
  // Require active seller
  try {
    await requireActiveSellerServer();
  } catch (error) {
    redirect("/profile");
  }

  return (
    <div className="container mx-auto max-w-4xl py-6 md:py-8 px-4">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/wardrobe">← Back to Wardrobe</Link>
          </Button>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-primary">Link QR Code to Item</h1>
        <p className="text-muted-foreground mt-2">
          Scan a QR code and link it to an item from your wardrobe. The item will be moved to RACK status.
        </p>
      </div>

      <QRCodeLinkingForm />
    </div>
  );
}

