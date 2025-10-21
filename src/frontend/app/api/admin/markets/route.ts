import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";
import { marketCreationSchema } from "@/lib/validations/schemas";

// ============================================================================
// ADMIN MARKET CREATION API
// ============================================================================

/**
 * POST /api/admin/markets
 * Create a new market (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminProfile = await requireAdminServer();
    
    // Parse and validate request body
    const body = await request.json();
    const validation = marketCreationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    const {
      name,
      description,
      location,
      startDate,
      endDate,
      maxSellers = 50,
      hangerPrice = 5.00
    } = validation.data;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Parse dates
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    // Validate date logic
    if (endDateTime <= startDateTime) {
      return NextResponse.json(
        {
          success: false,
          error: "End date must be after start date"
        },
        { status: 400 }
      );
    }
    
    // Check for overlapping markets at the same location
    const { data: overlappingMarkets, error: overlapError } = await supabase
      .from("markets")
      .select("id, name, start_date, end_date")
      .eq("location_name", location)
      .or(`and(start_date.lte.${startDateTime.toISOString()},end_date.gte.${startDateTime.toISOString()}),and(start_date.lte.${endDateTime.toISOString()},end_date.gte.${endDateTime.toISOString()}),and(start_date.gte.${startDateTime.toISOString()},end_date.lte.${endDateTime.toISOString()})`);
    
    if (overlapError) {
      console.error("Error checking for overlapping markets:", overlapError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check for overlapping markets"
        },
        { status: 500 }
      );
    }
    
    if (overlappingMarkets && overlappingMarkets.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A market already exists at this location during the specified time period",
          details: {
            overlappingMarkets: overlappingMarkets.map(market => ({
              id: market.id,
              name: market.name,
              startDate: market.start_date,
              endDate: market.end_date
            }))
          }
        },
        { status: 409 }
      );
    }
    
    // Create the market
    const { data: market, error: createError } = await supabase
      .from("markets")
      .insert({
        name,
        description,
        location_name: location,
        location_address: location, // Using location as address for now
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        max_vendors: maxSellers,
        current_vendors: 0,
        hanger_price: hangerPrice,
        status: "DRAFT",
        created_by: adminProfile.id
      })
      .select(`
        id,
        name,
        description,
        location_name,
        location_address,
        location_lat,
        location_lng,
        start_date,
        end_date,
        max_vendors,
        current_vendors,
        hanger_price,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .single();
    
    if (createError) {
      console.error("Error creating market:", createError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create market",
          details: createError.message
        },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          market: {
            id: market.id,
            name: market.name,
            description: market.description,
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
              currentVendors: market.current_vendors
            },
            pricing: {
              hangerPrice: market.hanger_price
            },
            status: market.status,
            createdBy: market.created_by,
            createdAt: market.created_at,
            updatedAt: market.updated_at
          }
        }
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error("Admin market creation error:", error);
    
    // Handle authentication errors
    if (error.message === "Authentication required" || error.message === "Admin status required") {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 401 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/markets
 * Get all markets with admin details (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    
    // Validate pagination
    if (page < 1 || limit < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pagination parameters"
        },
        { status: 400 }
      );
    }
    
    // Validate sort parameters
    const allowedSortFields = ["created_at", "updated_at", "start_date", "end_date", "name", "status"];
    if (!allowedSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid sort field"
        },
        { status: 400 }
      );
    }
    
    const allowedSortOrders = ["asc", "desc"];
    if (!allowedSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid sort order"
        },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Build query
    let query = supabase
      .from("markets")
      .select(`
        id,
        name,
        description,
        location_name,
        location_address,
        location_lat,
        location_lng,
        start_date,
        end_date,
        max_vendors,
        current_vendors,
        hanger_price,
        status,
        created_by,
        created_at,
        updated_at,
        profiles!markets_created_by_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `);
    
    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location_name.ilike.%${search}%`);
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data: markets, error: fetchError } = await query;
    
    if (fetchError) {
      console.error("Error fetching markets:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch markets",
          details: fetchError.message
        },
        { status: 500 }
      );
    }
    
    // Get total count for pagination
    let countQuery = supabase
      .from("markets")
      .select("*", { count: "exact", head: true });
    
    if (status) {
      countQuery = countQuery.eq("status", status);
    }
    
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,location_name.ilike.%${search}%`);
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error("Error getting market count:", countError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get market count",
          details: countError.message
        },
        { status: 500 }
      );
    }
    
    // Format response
    const formattedMarkets = markets?.map(market => ({
      id: market.id,
      name: market.name,
      description: market.description,
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
        availableSpots: market.max_vendors - market.current_vendors
      },
      pricing: {
        hangerPrice: market.hanger_price
      },
      status: market.status,
      createdBy: {
        id: market.profiles?.[0]?.id,
        name: market.profiles?.[0] ? `${market.profiles[0].first_name} ${market.profiles[0].last_name}` : "Unknown",
        email: market.profiles?.[0]?.email
      },
      createdAt: market.created_at,
      updatedAt: market.updated_at
    })) || [];
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          markets: formattedMarkets,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
            hasNext: page * limit < (count || 0),
            hasPrev: page > 1
          },
          filters: {
            status,
            search,
            sortBy,
            sortOrder
          }
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin markets fetch error:", error);
    
    // Handle authentication errors
    if (error.message === "Authentication required" || error.message === "Admin status required") {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 401 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
