import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateQRCodeFormat } from "@/lib/qr/generation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { QRAddToCartButton } from "@/components/items/qr-add-to-cart-button";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function QRCodePage({ params }: PageProps) {
  const resolvedParams = await params;
  const code = decodeURIComponent(resolvedParams.code);

  // Validate QR code format
  if (!validateQRCodeFormat(code)) {
    notFound();
  }

  const supabase = await createClient();

  // Get QR code with batch and market info
  const { data: qrCode, error: qrError } = await supabase
    .from("qr_codes")
    .select(`
      *,
      qr_batches!inner(
        id,
        market_id,
        market:markets(
          id,
          name,
          status
        )
      )
    `)
    .eq("code", code)
    .single();

  if (qrError || !qrCode) {
    return (
      <div className="container mx-auto max-w-4xl py-6 md:py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-red-100">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">QR Code Not Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This QR code does not exist in our system.
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  {code}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const batch = qrCode.qr_batches as any;
  const market = batch?.market || null;

  // If QR code is linked to an item, show item details
  if (qrCode.item_id && qrCode.status === "LINKED") {
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select(`
        id,
        title,
        description,
        selling_price,
        image_urls,
        thumbnail_url,
        status,
        owner_id,
        category,
        gender,
        condition,
        brand:brands(*),
        color:colors(*),
        size:sizes(*),
        subcategory:item_subcategories(*),
        owner:profiles!items_owner_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq("id", qrCode.item_id)
      .single();

    if (!itemError && item) {
      return (
        <div className="container mx-auto max-w-4xl py-6 md:py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>Scanned QR Code: {code}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image Gallery */}
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {item.thumbnail_url && (
                      <Image
                        src={item.thumbnail_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  {item.image_urls && item.image_urls.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {item.image_urls.slice(0, 4).map((url: string, index: number) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                          <Image
                            src={url}
                            alt={`${item.title} - Image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Item Information */}
                <div className="space-y-6">
                  {/* Title and Price */}
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{item.title}</h2>
                            {item.selling_price && (
                              <p className="text-4xl font-black text-primary mb-4">
                                CHF {item.selling_price.toFixed(2)}
                              </p>
                            )}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-base whitespace-pre-wrap">{item.description}</p>
                    </div>
                  )}

                  {/* Item Details Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {item.brand && (
                      <div>
                        <p className="text-sm text-muted-foreground">Brand</p>
                        <p className="font-medium">
                          {typeof item.brand === "string" 
                            ? item.brand 
                            : (Array.isArray(item.brand) ? (item.brand as any)[0]?.name : (item.brand as any)?.name) || "Not specified"}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium capitalize">
                        {item.category?.toLowerCase().replace(/_/g, " ") || "Not specified"}
                      </p>
                    </div>

                    {item.subcategory && (
                      <div>
                        <p className="text-sm text-muted-foreground">Subcategory</p>
                        <p className="font-medium">
                          {typeof item.subcategory === "string" 
                            ? item.subcategory 
                            : (Array.isArray(item.subcategory) ? (item.subcategory as any)[0]?.name : (item.subcategory as any)?.name) || "Not specified"}
                        </p>
                      </div>
                    )}

                    {item.size && (
                      <div>
                        <p className="text-sm text-muted-foreground">Size</p>
                        <p className="font-medium">
                          {typeof item.size === "string" 
                            ? item.size 
                            : (Array.isArray(item.size) ? (item.size as any)[0]?.name : (item.size as any)?.name) || "Not specified"}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">
                        {item.gender?.toLowerCase() || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Condition</p>
                      <p className="font-medium capitalize">
                        {item.condition?.toLowerCase().replace(/_/g, " ") || "Not specified"}
                      </p>
                    </div>

                    {item.color && (
                      <div>
                        <p className="text-sm text-muted-foreground">Color</p>
                        <p className="font-medium">
                          {typeof item.color === "string" 
                            ? item.color 
                            : (Array.isArray(item.color) ? (item.color as any)[0]?.name : (item.color as any)?.name) || "Not specified"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Seller and Market Info */}
                  <div className="pt-4 border-t space-y-3">
                    {item.owner && (
                      <div>
                        <p className="text-sm text-muted-foreground">Seller</p>
                        <p className="font-medium">
                          {Array.isArray(item.owner) 
                            ? `${(item.owner as any)[0]?.first_name || ""} ${(item.owner as any)[0]?.last_name || ""}`.trim()
                            : `${(item.owner as any).first_name || ""} ${(item.owner as any).last_name || ""}`.trim()}
                        </p>
                      </div>
                    )}
                    {market && (
                      <div>
                        <p className="text-sm text-muted-foreground">Market</p>
                        <p className="font-medium">{market.name}</p>
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <div className="pt-6 border-t">
                    <QRAddToCartButton
                      itemId={item.id}
                      itemStatus={item.status}
                      itemTitle={item.title}
                      ownerId={item.owner_id}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // QR code exists but not linked to an item
  return (
    <div className="container mx-auto max-w-4xl py-6 md:py-8 px-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold">QR Code Not Linked</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This QR code has not been linked to an item yet.
              </p>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {code}
              </p>
              {market && (
                <p className="text-sm text-muted-foreground mt-2">
                  Market: {market.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

