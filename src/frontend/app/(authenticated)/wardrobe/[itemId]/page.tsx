import { notFound, redirect } from "next/navigation";
import { getItemById } from "@/features/items/queries";
import { getUserProfileServer } from "@/lib/auth/utils";
import { ItemDetailView } from "@/components/items/item-detail-view";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const resolvedParams = await params;
  const [item, profile] = await Promise.all([
    getItemById(resolvedParams.itemId),
    getUserProfileServer(),
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

  return (
    <ItemDetailView
      item={item}
      isActiveSeller={isActiveSeller}
      wardrobeIsPublic={wardrobeIsPublic}
      userId={profile.id}
    />
  );
}
