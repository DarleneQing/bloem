import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Get all enrollments for the user
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("market_enrollments")
      .select("market_id")
      .eq("seller_id", user.id);

    if (enrollmentError || !enrollments || enrollments.length === 0) {
      return NextResponse.json({ data: { markets: [] } }, { status: 200 });
    }

    const marketIds = enrollments.map(e => e.market_id);

    // Fetch markets with full details
    const { data: markets, error: marketsError } = await supabase
      .from("markets")
      .select("id,name,description,picture_url,location_name,location_address,location_lat,location_lng,start_date,end_date,max_vendors,current_vendors,max_hangers,current_hangers,hanger_price,status,created_at,updated_at")
      .in("id", marketIds)
      .order("start_date", { ascending: true });

    if (marketsError || !markets) {
      return NextResponse.json({ data: { markets: [] } }, { status: 200 });
    }

    // Calculate live vendor counts by counting enrollments
    const fetchedMarketIds = markets.map((m: any) => m.id);
    let vendorsMap: Record<string, number> = {};
    let hangersMap: Record<string, number> = {};
    
    if (fetchedMarketIds.length > 0) {
      const [{ data: enrollments }, { data: rentals }] = await Promise.all([
        supabase.from("market_enrollments").select("market_id").in("market_id", fetchedMarketIds),
        supabase.from("hanger_rentals").select("market_id,hanger_count,status").in("market_id", fetchedMarketIds)
      ]);
      
      (enrollments || []).forEach((e: any) => {
        vendorsMap[e.market_id] = (vendorsMap[e.market_id] || 0) + 1;
      });
      
      (rentals || []).forEach((r: any) => {
        if (r.status === "PENDING" || r.status === "CONFIRMED") {
          hangersMap[r.market_id] = (hangersMap[r.market_id] || 0) + Number(r.hanger_count || 0);
        }
      });
    }

    // Transform markets to match MarketSummary format
    const formattedMarkets = markets.map((market: any) => {
      const maxVendors = Number(market.max_vendors ?? 0);
      const currentVendors = vendorsMap[market.id] ?? Number(market.current_vendors ?? 0);
      const maxHangers = Number(market.max_hangers ?? 0);
      const currentHangers = hangersMap[market.id] ?? Number(market.current_hangers ?? 0);
      
      return {
        id: market.id,
        name: market.name,
        description: market.description,
        pictureUrl: market.picture_url,
        location: {
          name: market.location_name,
          address: market.location_address,
          lat: market.location_lat,
          lng: market.location_lng
        },
        dates: {
          start: market.start_date,
          end: market.end_date
        },
        capacity: {
          maxVendors,
          currentVendors,
          availableSpots: Math.max(0, maxVendors - currentVendors),
          maxHangers,
          currentHangers,
          availableHangers: Math.max(0, maxHangers - currentHangers)
        },
        pricing: {
          hangerPrice: market.hanger_price
        },
        status: market.status,
        createdAt: market.created_at,
        updatedAt: market.updated_at
      };
    });

    return NextResponse.json({ 
      data: { 
        markets: formattedMarkets 
      } 
    }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching enrolled markets:", err);
    return NextResponse.json({ data: { markets: [] } }, { status: 200 });
  }
}

