import { notFound, redirect } from "next/navigation";
import { getItemById, getLinkedQRCodeForItem } from "@/features/items/queries";
import { getUserProfileServer } from "@/lib/auth/utils";
import { ItemDetailView } from "@/components/items/item-detail-view";
import { generateQRCodeImage } from "@/lib/qr/generation";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const resolvedParams = await params;
  const [item, profile, linkedQr] = await Promise.all([
    getItemById(resolvedParams.itemId),
    getUserProfileServer(),
    getLinkedQRCodeForItem(resolvedParams.itemId),
  ]);

  if (!item) {
    notFound();
  }

  if (!profile) {
    redirect("/auth/sign-in");
  }

  if (profile.id !== item.owner_id) {
    notFound();
  }

  const isActiveSeller = !!profile.iban_verified_at;
  const wardrobeIsPublic = profile.wardrobe_status === "PUBLIC";

  let qrImageDataUrl: string | null = null;
  if (linkedQr?.code) {
    qrImageDataUrl = await generateQRCodeImage(linkedQr.code, undefined, {
      width: 160,
      margin: 1,
    });
  }

  return (
    <ItemDetailView
      item={item}
      isActiveSeller={isActiveSeller}
      wardrobeIsPublic={wardrobeIsPublic}
      userId={profile.id}
      qrImageDataUrl={qrImageDataUrl}
    />
  );
}
