import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { USER_VISIBLE_MARKET_STATUS } from "@/lib/markets/user-visibility";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: { markets: [] } }, { status: 200 });
    }

    const { data: favorites, error: favoritesError } = await supabase
      .from("favorites")
      .select("market_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (favoritesError || !favorites || favorites.length === 0) {
      return NextResponse.json({ data: { markets: [] } }, { status: 200 });
    }

    const marketIds = favorites.map((f) => f.market_id);

    const { data: markets, error: marketsError } = await supabase
      .from("markets")
      .select(
        "id,name,description,picture_url,location_name,location_address,location_lat,location_lng,start_date,end_date,max_vendors,current_vendors,max_hangers,current_hangers,hanger_price,status,created_at,updated_at"
      )
      .in("id", marketIds)
      .eq("status", USER_VISIBLE_MARKET_STATUS)
      .order("start_date", { ascending: true });

    if (marketsError || !markets) {
      return NextResponse.json({ data: { markets: [] } }, { status: 200 });
    }

    const favoriteOrder = new Map(marketIds.map((id, index) => [id, index]));
    const sortedMarkets = [...markets].sort(
      (a, b) => (favoriteOrder.get(a.id) ?? 0) - (favoriteOrder.get(b.id) ?? 0)
    );

    const fetchedMarketIds = sortedMarkets.map((m) => m.id);
    const vendorsMap: Record<string, number> = {};
    const hangersMap: Record<string, number> = {};

    if (fetchedMarketIds.length > 0) {
      const [{ data: enrollments }, { data: rentals }] = await Promise.all([
        supabase.from("market_enrollments").select("market_id").in("market_id", fetchedMarketIds),
        supabase
          .from("hanger_rentals")
          .select("market_id,hanger_count,status")
          .in("market_id", fetchedMarketIds),
      ]);

      enrollments?.forEach((e) => {
        if (e.market_id) {
          vendorsMap[e.market_id] = (vendorsMap[e.market_id] ?? 0) + 1;
        }
      });

      rentals?.forEach((r) => {
        if (r.market_id && (r.status === "PENDING" || r.status === "CONFIRMED")) {
          hangersMap[r.market_id] = (hangersMap[r.market_id] ?? 0) + (Number(r.hanger_count) || 0);
        }
      });
    }

    const formattedMarkets = sortedMarkets.map((market) => {
      const maxVendors = Math.max(0, Number(market.max_vendors ?? 0) || 0);
      const currentVendors = Math.max(0, vendorsMap[market.id] ?? 0);
      const maxHangers = Math.max(0, Number(market.max_hangers ?? 0) || 0);
      const currentHangers = Math.max(0, hangersMap[market.id] ?? 0);

      return {
        id: market.id,
        name: market.name,
        description: market.description,
        pictureUrl: market.picture_url,
        location: {
          name: market.location_name,
          address: market.location_address,
          lat: market.location_lat,
          lng: market.location_lng,
        },
        dates: {
          start: market.start_date,
          end: market.end_date,
        },
        capacity: {
          maxVendors,
          currentVendors,
          availableSpots: Math.max(0, maxVendors - currentVendors),
          maxHangers,
          currentHangers,
          availableHangers: Math.max(0, maxHangers - currentHangers),
        },
        pricing: {
          hangerPrice: market.hanger_price,
        },
        status: market.status,
        createdAt: market.created_at,
        updatedAt: market.updated_at,
      };
    });

    return NextResponse.json({ data: { markets: formattedMarkets } }, { status: 200 });
  } catch (err) {
    console.error("Error fetching following markets:", err);
    return NextResponse.json({ data: { markets: [] } }, { status: 200 });
  }
}
