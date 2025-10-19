import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/items/image-gallery";
import { StatusBadge } from "@/components/items/status-badge";
import { getItemById } from "@/features/items/queries";
import { getUserProfile } from "@/features/auth/queries";
import { ItemActions } from "@/components/items/item-actions";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const resolvedParams = await params;
  const [item, profile] = await Promise.all([
    getItemById(resolvedParams.itemId),
    getUserProfile(),
  ]);

  if (!item) {
    notFound();
  }

  if (!profile) {
    redirect("/auth/sign-in");
  }

  // Check if user owns this item
  const isOwner = profile.id === item.owner_id;

  // For now, only owners can view their items
  // Public wardrobe viewing will be managed separately
  if (!isOwner) {
    notFound();
  }

  const isActiveSeller = !!profile.iban_verified_at;

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      {/* Back Button */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/wardrobe">← Back to Wardrobe</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <ImageGallery images={item.image_urls} title={item.title} />
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Title and Status */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <StatusBadge status={item.status} />
            </div>
            {item.selling_price && (
              <p className="text-2xl font-semibold text-primary">
                €{item.selling_price.toFixed(2)}
              </p>
            )}
          </div>

          {/* Owner Info (if viewing someone else's item) */}
          {!isOwner && (
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Owned by</p>
              <p className="font-medium">{item.owner.first_name} {item.owner.last_name}</p>
              {item.owner.iban_verified_at && (
                <span className="inline-block mt-2 text-xs bg-primary/15 text-primary px-2 py-1 rounded">
                  Verified Seller
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
          </div>

          {/* Item Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {item.brand && (
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-medium">{item.brand}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium capitalize">{item.category.toLowerCase().replace(/_/g, " ")}</p>
            </div>

            {item.size && (
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">{item.size}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Condition</p>
              <p className="font-medium capitalize">
                {item.condition.toLowerCase().replace(/_/g, " ")}
              </p>
            </div>

            {item.color && (
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-medium">{item.color}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Listed</p>
              <p className="font-medium">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions (owner only) */}
          {isOwner && (
            <ItemActions item={item} isActiveSeller={isActiveSeller} />
          )}
        </div>
      </div>
    </div>
  );
}

