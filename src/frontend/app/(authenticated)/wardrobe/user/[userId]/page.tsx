import { notFound } from "next/navigation";
import {
  getPublicWardrobe,
  getPublicWardrobeStats,
  type EnrichedItem,
} from "@/features/items/queries";
import { getUserProfileServer, isActiveSellerProfile } from "@/lib/auth/utils";
import { ItemCard } from "@/components/items/item-card";
import { PublicWardrobeHeader } from "@/components/wardrobe/public-wardrobe-header";
import { PublicWardrobeCategoryFilter } from "@/components/wardrobe/public-wardrobe-category-filter";
import { createClient } from "@/lib/supabase/server";

export default async function PublicWardrobePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, avatar_url, stripe_payouts_enabled, created_at, wardrobe_status"
    )
    .eq("id", resolvedParams.userId)
    .single();

  if (!ownerProfile) {
    notFound();
  }

  const currentUser = await getUserProfileServer();
  const isOwnProfile = currentUser?.id === ownerProfile.id;
  const isWardrobePublic = ownerProfile.wardrobe_status === "PUBLIC";

  if (!isWardrobePublic && !isOwnProfile) {
    notFound();
  }

  const [items, stats] = await Promise.all([
    getPublicWardrobe(resolvedParams.userId, {
      category: resolvedSearchParams.category,
    }),
    getPublicWardrobeStats(resolvedParams.userId, isOwnProfile),
  ]);

  const wardrobeItems = (items ?? []) as EnrichedItem[];
  const hasPublicItems = wardrobeItems.length > 0;
  const isActiveSeller = isActiveSellerProfile(ownerProfile);

  return (
    <div className="mx-auto w-full max-w-lg pb-28 md:max-w-7xl md:pb-8">
      <PublicWardrobeHeader
        firstName={ownerProfile.first_name}
        lastName={ownerProfile.last_name}
        avatarUrl={ownerProfile.avatar_url}
        memberSince={ownerProfile.created_at}
        isActiveSeller={isActiveSeller}
        isOwnProfile={isOwnProfile}
        shareUrl=""
        stats={stats}
      />

      <div className="px-4">
        {!isWardrobePublic && isOwnProfile ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-12 text-center">
            <h2 className="text-lg font-semibold text-foreground">Your wardrobe is private</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Turn on public wardrobe in profile settings so others can view your collection.
            </p>
          </div>
        ) : !hasPublicItems ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-12 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              {isOwnProfile ? "Your public wardrobe is empty" : "This wardrobe is empty"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isOwnProfile
                ? "Upload items to your wardrobe to share them here."
                : "This user has not added any items to their wardrobe yet."}
            </p>
          </div>
        ) : (
          <>
            <PublicWardrobeCategoryFilter
              userId={resolvedParams.userId}
              activeCategory={resolvedSearchParams.category}
            />

            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
              {wardrobeItems.map((item) => (
                <ItemCard key={item.id} item={item} variant="public" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
