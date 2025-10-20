import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProfileServer } from "@/lib/auth/utils";
import { getMyItems, getMyItemsStats } from "@/features/items/queries";
import { ItemCard } from "@/components/items/item-card";
import { EmptyWardrobe } from "@/components/items/empty-wardrobe";

export default async function WardrobePage() {
  const profile = await getUserProfileServer();

  if (!profile) {
    return null;
  }

  const isActiveSeller = !!profile.iban_verified_at;
  const [allItems, stats] = await Promise.all([getMyItems(), getMyItemsStats()]);

  const displayItems = allItems?.filter(
    (item) => item.status === "WARDROBE"
  );

  const forSaleItems = allItems?.filter(
    (item) => item.status === "RACK"
  );

  const soldItems = allItems?.filter((item) => item.status === "SOLD");

  return (
    <div className="container mx-auto max-w-7xl py-6 md:py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/images/logo-transparent.png"
            alt="Bloem"
            width={100}
            height={30}
            className="h-8 w-auto md:hidden"
            priority
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-primary">My Wardrobe</h1>
            {stats && <p className="text-base text-muted-foreground mt-2">{stats.total} items in total</p>}
          </div>
        </div>
        <Button asChild variant="accent" size="lg" className="w-full sm:w-auto">
          <Link href="/wardrobe/upload">Upload Item</Link>
        </Button>
      </div>

      {!allItems || allItems.length === 0 ? (
        <EmptyWardrobe isActiveSeller={isActiveSeller} />
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 md:mb-8 w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">
              All
              {stats && <span className="ml-1.5 text-xs opacity-70">({stats.total})</span>}
            </TabsTrigger>
            <TabsTrigger value="display" className="flex-1 sm:flex-none">
              Display
              {stats && <span className="ml-1.5 text-xs opacity-70">({stats.display})</span>}
            </TabsTrigger>
            {isActiveSeller && (
              <>
                <TabsTrigger value="forsale" className="flex-1 sm:flex-none">
                  For Sale
                  {stats && <span className="ml-1.5 text-xs opacity-70">({stats.forSale})</span>}
                </TabsTrigger>
                <TabsTrigger value="sold" className="flex-1 sm:flex-none">
                  Sold
                  {stats && <span className="ml-1.5 text-xs opacity-70">({stats.sold})</span>}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {allItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="display">
            {displayItems && displayItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {displayItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">No items in display mode</p>
              </div>
            )}
          </TabsContent>

          {isActiveSeller && (
            <>
              <TabsContent value="forsale">
                {forSaleItems && forSaleItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {forSaleItems.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4">
                    <p className="text-lg text-muted-foreground mb-3">No items ready for sale</p>
                    <p className="text-base text-muted-foreground">
                      Move items to your rack to prepare them for selling at markets
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sold">
                {soldItems && soldItems.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {soldItems.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">No sold items yet</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      )}

      {!isActiveSeller && allItems && allItems.length > 0 && (
        <div className="rounded-lg border bg-blue-50 border-blue-200 p-6 mt-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Become a Seller</h3>
              <p className="text-blue-800 mb-4">
                Activate your seller account to list items at pop-up markets and earn money from
                your wardrobe.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">Activate Seller Account</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
