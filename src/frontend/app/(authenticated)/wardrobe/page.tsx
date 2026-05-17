import { getUserProfileServer } from "@/lib/auth/utils";
import { getMyItems, getMyItemsStats } from "@/features/items/queries";
import { WardrobeView } from "@/components/wardrobe/wardrobe-view";

export default async function WardrobePage() {
  const profile = await getUserProfileServer();

  if (!profile) {
    return null;
  }

  const isActiveSeller = !!profile.iban_verified_at;
  const [allItems, stats] = await Promise.all([getMyItems(), getMyItemsStats()]);

  const items = allItems ?? [];
  const wardrobeStats = stats ?? { total: 0, display: 0, forSale: 0, sold: 0 };

  return (
    <WardrobeView
      isActiveSeller={isActiveSeller}
      allItems={items}
      stats={wardrobeStats}
    />
  );
}
