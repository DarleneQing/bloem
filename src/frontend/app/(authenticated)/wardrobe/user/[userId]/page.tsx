import { notFound } from "next/navigation";
import Image from "next/image";
import { getPublicWardrobe } from "@/features/items/queries";
import { getUserProfile } from "@/features/auth/queries";
import { ItemCard } from "@/components/items/item-card";
import { ITEM_CATEGORIES } from "@/types/items";
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

  // Get the owner's profile
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, iban_verified_at, created_at")
    .eq("id", resolvedParams.userId)
    .single();

  if (!ownerProfile) {
    notFound();
  }

  // Get current user (to check if viewing own profile)
  const currentUser = await getUserProfile();
  const isOwnProfile = currentUser?.id === ownerProfile.id;

  // Get public items with optional category filter
  const items = await getPublicWardrobe(resolvedParams.userId, {
    category: resolvedSearchParams.category,
  });

  const hasPublicItems = items && items.length > 0;
  const isActiveSeller = !!ownerProfile.iban_verified_at;

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      {/* User Header */}
      <div className="mb-8 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          {ownerProfile.avatar_url ? (
            <Image
              src={ownerProfile.avatar_url}
              alt={`${ownerProfile.first_name} ${ownerProfile.last_name}`}
              width={96}
              height={96}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <svg
              className="w-12 h-12 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {isOwnProfile ? "My Public Wardrobe" : `${ownerProfile.first_name} ${ownerProfile.last_name}'s Wardrobe`}
        </h1>

        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          {isActiveSeller && (
            <span className="inline-flex items-center gap-1 bg-primary/15 text-primary px-3 py-1 rounded-full font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Verified Seller
            </span>
          )}
          <span>
            Member since {new Date(ownerProfile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Category Filter */}
      {hasPublicItems && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <a
              href={`/wardrobe/user/${resolvedParams.userId}`}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                !resolvedSearchParams.category
                  ? "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              All
            </a>
            {ITEM_CATEGORIES.map((cat) => (
              <a
                key={cat.value}
                href={`/wardrobe/user/${resolvedParams.userId}?category=${cat.value}`}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  resolvedSearchParams.category === cat.value
                    ? "bg-primary text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Items Grid or Empty State */}
          {!hasPublicItems ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">This wardrobe is empty or private</h2>
          <p className="text-muted-foreground">
            {isOwnProfile
              ? "Upload items to your wardrobe to get started."
              : "This user hasn't added any items to their wardrobe yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <p className="text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

