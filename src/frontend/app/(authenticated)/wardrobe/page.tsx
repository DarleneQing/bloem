import { getUserProfileServer } from "@/lib/auth/utils";
import { getMyItems, getMyItemsStats, getMyPurchasedItems } from "@/features/items/queries";
import { WardrobeView } from "@/components/wardrobe/wardrobe-view";

interface WardrobePageProps {
  searchParams: { tab?: string };
}

export default async function WardrobePage({ searchParams }: WardrobePageProps) {
  const profile = await getUserProfileServer();

  if (!profile) {
    return null;
  }

  const isActiveSeller = profile.isActiveSeller;
  const [allItems, stats, purchasedItems] = await Promise.all([
    getMyItems(),
    getMyItemsStats(),
    getMyPurchasedItems(),
  ]);

  const items = allItems ?? [];
  const wardrobeStats = stats ?? { total: 0, display: 0, forSale: 0, sold: 0 };

  const defaultTab = searchParams.tab === "purchased" ? "purchased" : "all";

  return (
    <WardrobeView
      isActiveSeller={isActiveSeller}
      allItems={items}
      stats={wardrobeStats}
      purchasedItems={purchasedItems ?? []}
      defaultTab={defaultTab}
    />
  );
}
