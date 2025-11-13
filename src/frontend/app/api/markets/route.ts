import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Public market listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const statusParam = (searchParams.get("status") || "ACTIVE").toUpperCase();
    const allowedStatuses = ["ACTIVE", "COMPLETED", "ALL"] as const;
    if (!allowedStatuses.includes(statusParam as any)) {
      return NextResponse.json(
        { success: false, error: "Invalid status parameter" },
        { status: 400 }
      );
    }

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 50);
    const offset = (page - 1) * limit;

    const search = searchParams.get("search")?.trim();
    const sortBy = (searchParams.get("sortBy") || "start_date").toLowerCase();
    const sortOrder = (searchParams.get("sortOrder") || "asc").toLowerCase();

    const allowedSortFields = ["start_date", "created_at"];
    const allowedSortOrders = ["asc", "desc"];
    if (!allowedSortFields.includes(sortBy) || !allowedSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { success: false, error: "Invalid sort parameters" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let query = supabase
      .from("markets")
      .select("id,name,description,picture_url,location_name,location_address,location_lat,location_lng,start_date,end_date,max_vendors,current_vendors,max_hangers,current_hangers,hanger_price,unlimited_hangers_per_seller,max_hangers_per_seller,status,created_at,updated_at", { count: "exact" });

    // Restrict public listing to ACTIVE/COMPLETED only
    if (statusParam === "ALL") {
      query = query.in("status", ["ACTIVE", "COMPLETED"]);
    } else {
      query = query.eq("status", statusParam);
    }

    if (search) {
      // Basic search on name/location
      query = query.or(
        `name.ilike.%${search}%,location_name.ilike.%${search}%,location_address.ilike.%${search}%`
      );
    }

    query = query.order(sortBy as any, { ascending: sortOrder === "asc" }).range(offset, offset + limit - 1);

    const { data: markets, error, count } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Calculate live vendor counts by counting enrollments
    const marketIds = (markets || []).map(m => m.id);
    let vendorsMap: Record<string, number> = {};
    let hangersMap: Record<string, number> = {};
    
    if (marketIds.length > 0) {
      const [{ data: enrollments }, { data: rentals }] = await Promise.all([
        supabase.from("market_enrollments").select("market_id").in("market_id", marketIds),
        supabase.from("hanger_rentals").select("market_id,hanger_count,status").in("market_id", marketIds)
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

    const formatted = (markets || []).map((m) => {
      const pictureUrl = (m as any).picture_url;
      console.log("Market:", m.name, "picture_url:", pictureUrl);
      
      const maxVendors = Number(m.max_vendors ?? 0);
      const currentVendors = vendorsMap[m.id] ?? Number(m.current_vendors ?? 0);
      const maxHangers = Number((m as any).max_hangers ?? 0);
      const currentHangers = hangersMap[m.id] ?? Number((m as any).current_hangers ?? 0);
      
      return {
      id: m.id,
      name: m.name,
      description: m.description,
      pictureUrl: pictureUrl || "/assets/images/brand-transparent.png",
      location: {
        name: m.location_name,
        address: m.location_address,
        lat: m.location_lat,
        lng: m.location_lng,
      },
      dates: {
        start: m.start_date,
        end: m.end_date,
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
        hangerPrice: m.hanger_price,
      },
      policy: {
        unlimitedHangersPerSeller: (m as any).unlimited_hangers_per_seller || false,
        maxHangersPerSeller: (m as any).max_hangers_per_seller || 5,
      },
      status: m.status,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    };
    });

    return NextResponse.json({ success: true, data: { markets: formatted, page, limit, total: count ?? 0 } });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}


