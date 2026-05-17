import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateQRCodeFormat } from "@/lib/qr/generation";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import {
  QrItemDetailView,
  type QrSimilarItem,
} from "@/components/qr-codes/qr-item-detail-view";

interface PageProps {
  params: Promise<{ code: string }>;
}

function QrStatusCard({
  title,
  description,
  code,
  marketName,
  tone,
}: {
  title: string;
  description: string;
  code: string;
  marketName?: string | null;
  tone: "error" | "warning";
}) {
  const toneClasses =
    tone === "error"
      ? { wrap: "bg-red-100", icon: "text-red-600" }
      : { wrap: "bg-yellow-100", icon: "text-yellow-600" };

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-lg items-center px-4 py-10">
      <Card className="w-full">
        <CardContent className="space-y-4 pt-8 pb-8 text-center">
          <div className="flex justify-center">
            <div className={`rounded-full p-3 ${toneClasses.wrap}`}>
              <AlertCircle className={`h-8 w-8 ${toneClasses.icon}`} />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
            <p className="font-mono text-sm text-muted-foreground">{code}</p>
            {marketName ? (
              <p className="text-sm text-muted-foreground">Market: {marketName}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function loadSimilarItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  marketId: string,
  category: string,
  excludeItemId: string
): Promise<QrSimilarItem[]> {
  const { data: rows, error } = await supabase
    .from("items")
    .select(
      `
      id,
      title,
      selling_price,
      thumbnail_url,
      qr_codes!inner(code)
    `
    )
    .eq("market_id", marketId)
    .eq("category", category)
    .eq("status", "RACK")
    .neq("id", excludeItemId)
    .limit(8);

  if (error || !rows) return [];

  return rows
    .map((row) => {
      const codes = row.qr_codes as { code: string }[] | { code: string } | null;
      const code = Array.isArray(codes) ? codes[0]?.code : codes?.code;
      if (!code || !row.thumbnail_url) return null;
      return {
        id: row.id,
        title: row.title,
        selling_price: row.selling_price,
        thumbnail_url: row.thumbnail_url,
        qrCode: code,
      } satisfies QrSimilarItem;
    })
    .filter((entry): entry is QrSimilarItem => entry != null);
}

export default async function QRCodePage({ params }: PageProps) {
  const resolvedParams = await params;
  const code = decodeURIComponent(resolvedParams.code);

  if (!validateQRCodeFormat(code)) {
    notFound();
  }

  const supabase = await createClient();

  const { data: qrCode, error: qrError } = await supabase
    .from("qr_codes")
    .select(
      `
      *,
      qr_batches!inner(
        id,
        market_id,
        market:markets(
          id,
          name,
          status,
          start_date
        )
      )
    `
    )
    .eq("code", code)
    .single();

  if (qrError || !qrCode) {
    return (
      <QrStatusCard
        tone="error"
        title="QR Code Not Found"
        description="This QR code does not exist in our system."
        code={code}
      />
    );
  }

  const batch = qrCode.qr_batches as {
    market_id: string;
    market: { id: string; name: string; status: string; start_date: string | null } | null;
  } | null;
  const market = batch?.market ?? null;

  if (qrCode.item_id && qrCode.status === "LINKED") {
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select(
        `
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
        market_id,
        purchase_price,
        brand:brands(*),
        color:colors(*),
        size:sizes(*),
        subcategory:item_subcategories(*),
        owner:profiles!items_owner_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          iban_verified_at
        )
      `
      )
      .eq("id", qrCode.item_id)
      .single();

    if (!itemError && item) {
      const marketId = item.market_id ?? batch?.market_id ?? market?.id;
      const similarItems =
        marketId != null
          ? await loadSimilarItems(supabase, marketId, item.category, item.id)
          : [];

      let sellerRackCount: number | null = null;
      if (marketId && item.owner_id) {
        const { count } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", item.owner_id)
          .eq("market_id", marketId)
          .eq("status", "RACK");
        sellerRackCount = count;
      }

      return (
        <QrItemDetailView
          qrCode={code}
          item={item}
          market={
            market
              ? {
                  id: market.id,
                  name: market.name,
                  start_date: market.start_date,
                }
              : null
          }
          similarItems={similarItems}
          sellerRackCount={sellerRackCount}
        />
      );
    }
  }

  return (
    <QrStatusCard
      tone="warning"
      title="QR Code Not Linked"
      description="This QR code has not been linked to an item yet."
      code={code}
      marketName={market?.name}
    />
  );
}
