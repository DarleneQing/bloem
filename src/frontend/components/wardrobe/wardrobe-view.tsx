"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemCard } from "@/components/items/item-card";
import { EmptyWardrobe } from "@/components/items/empty-wardrobe";
import { QRCodeLinkingButton } from "@/components/qr-codes/QRCodeLinkingButton";
import { WardrobePageHeader } from "@/components/wardrobe/wardrobe-page-header";
import { WardrobeStatsRow } from "@/components/wardrobe/wardrobe-stats-row";
import { WardrobeFab } from "@/components/wardrobe/wardrobe-fab";
import type { EnrichedItem } from "@/features/items/queries";
import { cn } from "@/lib/utils";

interface WardrobeStats {
  total: number;
  display: number;
  forSale: number;
  sold: number;
}

interface WardrobeViewProps {
  isActiveSeller: boolean;
  allItems: EnrichedItem[];
  stats: WardrobeStats;
  purchasedItems: EnrichedItem[];
  defaultTab?: string;
}

const TAB_TRIGGER_CLASS =
  "flex-1 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm";

function ItemGrid({ items }: { items: EnrichedItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} variant="wardrobe" />
      ))}
    </div>
  );
}

function EmptyTabMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function WardrobeView({ isActiveSeller, allItems, stats, purchasedItems, defaultTab = "all" }: WardrobeViewProps) {
  const displayItems = allItems.filter((item) => item.status === "WARDROBE");
  const forSaleItems = allItems.filter((item) => item.status === "RACK");
  const soldItems = allItems.filter((item) => item.status === "SOLD");

  const hasItems = allItems.length > 0;

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 md:max-w-7xl md:pb-8 md:pt-6">
      <WardrobePageHeader />

      {hasItems && (
        <div className="mb-4 hidden items-center justify-end gap-2 md:flex">
          {isActiveSeller && <QRCodeLinkingButton />}
          <Button asChild variant="accent" size="default">
            <Link href="/wardrobe/upload">Upload Item</Link>
          </Button>
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="mb-4 h-auto w-full gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className={TAB_TRIGGER_CLASS}>
            All
          </TabsTrigger>
          <TabsTrigger value="display" className={TAB_TRIGGER_CLASS}>
            Display
          </TabsTrigger>
          <TabsTrigger value="purchased" className={TAB_TRIGGER_CLASS}>
            Purchased
          </TabsTrigger>
          {isActiveSeller && (
            <>
              <TabsTrigger value="forsale" className={TAB_TRIGGER_CLASS}>
                For Sale
              </TabsTrigger>
              <TabsTrigger value="sold" className={TAB_TRIGGER_CLASS}>
                Sold
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {!hasItems ? (
          <>
            <TabsContent value="all" className="mt-0">
              <EmptyWardrobe />
            </TabsContent>
            <TabsContent value="display" className="mt-0">
              <EmptyTabMessage message="No items in display mode yet" />
            </TabsContent>
            <TabsContent value="purchased" className="mt-0">
              <EmptyTabMessage message="No purchased items yet" />
            </TabsContent>
            {isActiveSeller && (
              <>
                <TabsContent value="forsale" className="mt-0">
                  <EmptyTabMessage message="No items for sale yet" />
                </TabsContent>
                <TabsContent value="sold" className="mt-0">
                  <EmptyTabMessage message="No sold items yet" />
                </TabsContent>
              </>
            )}
          </>
        ) : (
          <>
            <WardrobeStatsRow
              total={stats.total}
              display={stats.display}
              forSale={stats.forSale}
              sold={stats.sold}
            />

            <TabsContent value="all" className="mt-0">
              <ItemGrid items={allItems} />
            </TabsContent>

            <TabsContent value="display" className="mt-0">
              {displayItems.length > 0 ? (
                <ItemGrid items={displayItems} />
              ) : (
                <EmptyTabMessage message="No items in display mode" />
              )}
            </TabsContent>

            <TabsContent value="purchased" className="mt-0">
              {purchasedItems.length > 0 ? (
                <ItemGrid items={purchasedItems} />
              ) : (
                <EmptyTabMessage message="No purchased items yet" />
              )}
            </TabsContent>

            {isActiveSeller && (
              <>
                <TabsContent value="forsale" className="mt-0">
                  {forSaleItems.length > 0 ? (
                    <ItemGrid items={forSaleItems} />
                  ) : (
                    <EmptyTabMessage message="Move items to your rack to prepare them for selling at markets" />
                  )}
                </TabsContent>

                <TabsContent value="sold" className="mt-0">
                  {soldItems.length > 0 ? (
                    <ItemGrid items={soldItems} />
                  ) : (
                    <EmptyTabMessage message="No sold items yet" />
                  )}
                </TabsContent>
              </>
            )}

            <WardrobeFab />
          </>
        )}
      </Tabs>

      {!isActiveSeller && hasItems && (
        <div className="mt-8 rounded-2xl border border-brand-lavender/40 bg-brand-lavender/15 p-5">
          <h3 className="mb-1 font-semibold text-primary">Become a Seller</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Activate your seller account to list items at pop-up markets and earn from your
            wardrobe.
          </p>
          <Button asChild variant="outline" size="sm" className={cn("border-primary/30")}>
            <Link href="/profile">Activate Seller Account</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
