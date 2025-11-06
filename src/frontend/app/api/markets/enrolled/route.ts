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

    // Transform markets to match MarketSummary format
    const formattedMarkets = markets.map((market: any) => ({
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
        maxVendors: market.max_vendors,
        currentVendors: market.current_vendors,
        maxHangers: market.max_hangers || 0,
        currentHangers: market.current_hangers || 0
      },
      pricing: {
        hangerPrice: market.hanger_price
      },
      status: market.status
    }));

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

