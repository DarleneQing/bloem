import { notFound, redirect } from "next/navigation";
import { getItemById, getLinkedQRCodeForItem } from "@/features/items/queries";
import { getUserProfileServer } from "@/lib/auth/utils";
import { ItemDetailView } from "@/components/items/item-detail-view";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const resolvedParams = await params;
  const [item, profile, linkedQRCode] = await Promise.all([
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

  const isActiveSeller = profile.isActiveSeller;
  const wardrobeIsPublic = profile.wardrobe_status === "PUBLIC";

  return (
    <ItemDetailView
      item={item}
      isActiveSeller={isActiveSeller}
      wardrobeIsPublic={wardrobeIsPublic}
      userId={profile.id}
      linkedQRCode={linkedQRCode}
    />
  );
}
