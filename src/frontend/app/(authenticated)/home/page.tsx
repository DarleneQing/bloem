import { getUserProfileServer } from "@/lib/auth/utils";
import { getDiscoverableRackItems } from "@/features/items/queries";
import { getHomeShopCategory, type HomeShopCategoryId } from "@/lib/home/shop-categories";
import { HomePageHeader } from "@/components/home/home-page-header";
import { HomeSearchBar } from "@/components/home/home-search-bar";
import { HomePromoCard } from "@/components/home/home-promo-card";
import { HomeCategoryRow } from "@/components/home/home-category-row";
import { HomePopularSection } from "@/components/home/home-popular-section";
import { HomeQuickActions } from "@/components/home/home-quick-actions";

interface HomePageProps {
  searchParams: Promise<{ shop?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [profile, items, resolvedSearchParams] = await Promise.all([
    getUserProfileServer(),
    getDiscoverableRackItems(24),
    searchParams,
  ]);

  const firstName = profile?.first_name?.trim() || "there";
  const shopCategory = getHomeShopCategory(resolvedSearchParams.shop);
  const activeCategoryId = shopCategory?.id as HomeShopCategoryId | undefined;

  return (
    <div className="container mx-auto max-w-lg px-4 py-5 pb-6 md:py-8">
      <HomePageHeader />
      <HomeSearchBar />
      <HomePromoCard />
      <HomeCategoryRow activeCategoryId={activeCategoryId} />
      <HomePopularSection items={items} activeCategoryId={activeCategoryId} />
      <HomeQuickActions firstName={firstName} />
    </div>
  );
}
