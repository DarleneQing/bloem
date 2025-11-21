"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Loader2 } from "lucide-react";
import { getItemById } from "@/features/items/queries";
import { addToCart } from "@/features/items/actions";
import type { EnrichedItem } from "@/features/items/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Item detail page with Add to Cart functionality
 */
export default function ItemDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  
  const itemId = params.id as string;
  
  const [item, setItem] = useState<EnrichedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch item data
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const itemData = await getItemById(itemId);
        setItem(itemData);
      } catch (error) {
        console.error("Failed to fetch item:", error);
        toast({
          title: "Error",
          description: "Failed to load item details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [itemId, toast]);

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!item) return;

    setIsAddingToCart(true);

    try {
      const result = await addToCart(item.id);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart",
        });
        // Optionally redirect to cart
        // router.push("/cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Item not found
  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Item not found</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/markets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Markets
          </Link>
        </Button>
      </div>
    );
  }

  const images = item.image_urls || [item.thumbnail_url];
  const canAddToCart = item.status === "RACK";
  const isOwnItem = false; // TODO: Check if current user is owner

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        asChild
        className="mb-6"
      >
        <Link href="/markets">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Markets
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-muted">
            <Image
              src={images[currentImageIndex]}
              alt={item.title}
              fill
              className="object-cover"
              priority
            />
            
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <Badge
                variant={
                  item.status === "RACK"
                    ? "default"
                    : item.status === "RESERVED"
                    ? "secondary"
                    : "destructive"
                }
              >
                {item.status}
              </Badge>
            </div>
          </div>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden ${
                    index === currentImageIndex
                      ? "ring-2 ring-primary"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${item.title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="space-y-6">
          {/* Title and Price */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
            {item.brand && (
              <p className="text-lg text-muted-foreground">
                {typeof item.brand === "string" ? item.brand : item.brand.name}
              </p>
            )}
            {item.selling_price && (
              <p className="text-3xl font-bold text-primary mt-4">
                CHF {item.selling_price.toFixed(2)}
              </p>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <Card className="p-4">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {item.description}
              </p>
            </Card>
          )}

          {/* Item Details */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Item Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium capitalize">
                  {item.category.toLowerCase()}
                </dd>
              </div>
              {item.size && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Size</dt>
                  <dd className="font-medium">
                    {typeof item.size === "string" ? item.size : item.size.name}
                  </dd>
                </div>
              )}
              {item.condition && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Condition</dt>
                  <dd className="font-medium">
                    {item.condition.replace(/_/g, " ")}
                  </dd>
                </div>
              )}
              {item.color && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Color</dt>
                  <dd className="font-medium">
                    {typeof item.color === "string" ? item.color : item.color.name}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Gender</dt>
                <dd className="font-medium capitalize">
                  {item.gender.toLowerCase()}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Add to Cart Button */}
          {canAddToCart && !isOwnItem && (
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          )}

          {item.status === "RESERVED" && (
            <Alert>
              <AlertDescription>
                This item is currently reserved by another buyer
              </AlertDescription>
            </Alert>
          )}

          {item.status === "SOLD" && (
            <Alert variant="destructive">
              <AlertDescription>This item has been sold</AlertDescription>
            </Alert>
          )}

          {isOwnItem && (
            <Alert>
              <AlertDescription>
                This is your item. You cannot add it to your cart.
              </AlertDescription>
            </Alert>
          )}

          {/* Continue Shopping */}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            asChild
          >
            <Link href="/markets">
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

