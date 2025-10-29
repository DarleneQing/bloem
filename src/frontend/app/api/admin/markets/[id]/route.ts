import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";
import { marketUpdateSchema, marketStatusSchema } from "@/lib/validations/schemas";
import { z } from "zod";

// ============================================================================
// ADMIN MARKET MANAGEMENT API
// ============================================================================

/**
 * GET /api/admin/markets/[id]
 * Get a specific market with admin details (Admin only)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    const marketId = params.id;
    
    // Validate UUID format
    const uuidSchema = z.string().uuid("Invalid market ID format");
    const validation = uuidSchema.safeParse(marketId);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid market ID format"
        },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Fetch market with related data
    const { data: market, error: fetchError } = await supabase
      .from("markets")
      .select(`
        id,
        name,
        description,
        picture_url,
        location_name,
        location_address,
        location_lat,
        location_lng,
        start_date,
        end_date,
        max_vendors,
        current_vendors,
        max_hangers,
        current_hangers,
        hanger_price,
        unlimited_hangers_per_seller,
        max_hangers_per_seller,
        status,
        created_by,
        created_at,
        updated_at,
        profiles!inner (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", marketId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Market not found"
          },
          { status: 404 }
        );
      }
      
      console.error("Error fetching market:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch market",
          details: fetchError.message
        },
        { status: 500 }
      );
    }
    
    // Get market statistics and related lists
    const [
      { data: hangerRentals, error: rentalsError },
      { data: items, error: itemsError },
      { data: transactions, error: transactionsError },
      { data: enrollments, error: enrollmentsError }
    ] = await Promise.all([
      supabase
        .from("hanger_rentals")
        .select("id, seller_id, hanger_count, total_price, status, payment_confirmed_at, created_at")
        .eq("market_id", marketId),
      
      supabase
        .from("items")
        .select("id, owner_id, title, selling_price, status, listed_at, sold_at")
        .eq("market_id", marketId),
      
      supabase
        .from("transactions")
        .select("id, type, status, total_amount, seller_amount, platform_fee, created_at")
        .eq("market_id", marketId),

      supabase
        .from("market_enrollments")
        .select("id, seller_id, created_at")
        .eq("market_id", marketId)
    ]);
    
    if (rentalsError) {
      console.error("Error fetching hanger rentals:", rentalsError);
    }
    
    if (itemsError) {
      console.error("Error fetching items:", itemsError);
    }
    
    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
    }
    
    // Calculate statistics
    const totalRevenue = transactions?.reduce((sum, t) => 
      t.status === "COMPLETED" ? sum + Number(t.total_amount) : sum, 0) || 0;
    
    const platformFees = transactions?.reduce((sum, t) => 
      t.status === "COMPLETED" ? sum + Number(t.platform_fee) : sum, 0) || 0;
    
    const sellerEarnings = transactions?.reduce((sum, t) => 
      t.status === "COMPLETED" ? sum + Number(t.seller_amount) : sum, 0) || 0;
    
    const totalHangersRented = hangerRentals?.reduce((sum, r) => sum + r.hanger_count, 0) || 0;
    
    const itemsSold = items?.filter(item => item.status === "SOLD").length || 0;
    const itemsOnRack = items?.filter(item => item.status === "RACK").length || 0;
    
    // Load seller profiles map for enrollments and rentals
    const sellerIds = Array.from(new Set([...(enrollments?.map(e => e.seller_id) || []), ...(hangerRentals?.map(r => r.seller_id) || [])]));
    let profilesMap: Record<string, any> = {};
    if (sellerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", sellerIds);
      (profiles || []).forEach((p) => {
        profilesMap[p.id] = p;
      });
    }

    // Compute live capacity
    const vendorsCurrent = (enrollments || []).length;
    const hangersCurrent = (hangerRentals || []).reduce((sum, r) => (r.status === "PENDING" || r.status === "CONFIRMED") ? sum + Number(r.hanger_count || 0) : sum, 0);

    // Format response
    const formattedMarket = {
      id: market.id,
      name: market.name,
      description: market.description,
      picture: (market as any).picture_url,
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
        currentVendors: vendorsCurrent,
        availableSpots: Number(market.max_vendors) - Number(vendorsCurrent),
        maxHangers: (market as any).max_hangers || 0,
        currentHangers: hangersCurrent,
        availableHangers: Number((market as any).max_hangers || 0) - Number(hangersCurrent)
      },
      pricing: {
        hangerPrice: market.hanger_price
      },
      policy: {
        unlimitedHangersPerSeller: (market as any).unlimited_hangers_per_seller || false,
        maxHangersPerSeller: (market as any).max_hangers_per_seller || 5
      },
      status: market.status,
      createdBy: {
        id: market.profiles?.[0]?.id,
        name: market.profiles?.[0] ? `${market.profiles[0].first_name} ${market.profiles[0].last_name}` : "Unknown",
        email: market.profiles?.[0]?.email
      },
      statistics: {
        totalRevenue,
        platformFees,
        sellerEarnings,
        totalHangersRented,
        itemsSold,
        itemsOnRack,
        totalItems: items?.length || 0,
        totalRentals: hangerRentals?.length || 0,
        totalTransactions: transactions?.length || 0
      },
      createdAt: market.created_at,
      updatedAt: market.updated_at
    };
    const formattedEnrollments = (enrollments || []).map((e) => ({
      id: e.id,
      enrolledAt: e.created_at,
      seller: {
        id: e.seller_id,
        name: profilesMap[e.seller_id] ? `${profilesMap[e.seller_id].first_name || ""} ${profilesMap[e.seller_id].last_name || ""}`.trim() || profilesMap[e.seller_id].email : e.seller_id,
        email: profilesMap[e.seller_id]?.email || null,
      }
    }));

    const formattedRentals = (hangerRentals || []).map((r) => ({
      id: r.id,
      status: r.status,
      hangerCount: r.hanger_count,
      totalPrice: r.total_price,
      createdAt: r.created_at,
      paymentConfirmedAt: r.payment_confirmed_at,
      seller: {
        id: r.seller_id,
        name: profilesMap[r.seller_id] ? `${profilesMap[r.seller_id].first_name || ""} ${profilesMap[r.seller_id].last_name || ""}`.trim() || profilesMap[r.seller_id].email : r.seller_id,
        email: profilesMap[r.seller_id]?.email || null,
      }
    }));
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          market: formattedMarket,
          enrollments: formattedEnrollments,
          rentals: formattedRentals
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin market fetch error:", error);
    
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
 * PUT /api/admin/markets/[id]
 * Update a specific market (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    const marketId = params.id;
    
    // Validate UUID format
    const uuidSchema = z.string().uuid("Invalid market ID format");
    const validation = uuidSchema.safeParse(marketId);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid market ID format"
        },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const updateValidation = marketUpdateSchema.safeParse({ ...body, id: marketId });
    
    if (!updateValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: updateValidation.error.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    const updateData = updateValidation.data;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Check if market exists
    const { data: existingMarket, error: checkError } = await supabase
      .from("markets")
      .select("id, status, start_date, end_date, location_name, location_address")
      .eq("id", marketId)
      .single();
    
    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Market not found"
          },
          { status: 404 }
        );
      }
      
      console.error("Error checking market existence:", checkError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check market existence",
          details: checkError.message
        },
        { status: 500 }
      );
    }
    
    // Validate date logic if dates are being updated
    if (updateData.startDate && updateData.endDate) {
      const startDateTime = new Date(updateData.startDate);
      const endDateTime = new Date(updateData.endDate);
      
      if (endDateTime <= startDateTime) {
        return NextResponse.json(
          {
            success: false,
            error: "End date must be after start date"
          },
          { status: 400 }
        );
      }
    }
    
    // Check for overlapping markets if location or dates are being updated
    if (updateData.location || updateData.startDate || updateData.endDate) {
      const location = updateData.location || existingMarket.location_address;
      const startDate = updateData.startDate || existingMarket.start_date;
      const endDate = updateData.endDate || existingMarket.end_date;
      
      const { data: overlappingMarkets, error: overlapError } = await supabase
        .from("markets")
        .select("id, name, start_date, end_date")
        .eq("location_address", location)
        .neq("id", marketId) // Exclude current market
        .or(`and(start_date.lte.${new Date(startDate).toISOString()},end_date.gte.${new Date(startDate).toISOString()}),and(start_date.lte.${new Date(endDate).toISOString()},end_date.gte.${new Date(endDate).toISOString()}),and(start_date.gte.${new Date(startDate).toISOString()},end_date.lte.${new Date(endDate).toISOString()})`);
      
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
    }
    
    // Prepare update data
    const updateFields: any = {};
    
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.picture !== undefined) updateFields.picture_url = updateData.picture || "/assets/images/brand-transparent.png";
    if (updateData.locationName !== undefined) updateFields.location_name = updateData.locationName;
    if (updateData.location) {
      updateFields.location_address = updateData.location;
    }
    if (updateData.startDate) updateFields.start_date = new Date(updateData.startDate).toISOString();
    if (updateData.endDate) updateFields.end_date = new Date(updateData.endDate).toISOString();
    if (updateData.maxSellers) updateFields.max_vendors = updateData.maxSellers;
    if (updateData.maxHangers !== undefined) updateFields.max_hangers = updateData.maxHangers;
    if (updateData.hangerPrice !== undefined) updateFields.hanger_price = updateData.hangerPrice;
    // Optional per-seller settings (not yet in schema): read directly from body
    if ((body as any)?.unlimitedHangersPerSeller !== undefined) {
      updateFields.unlimited_hangers_per_seller = Boolean((body as any)?.unlimitedHangersPerSeller);
    }
    if ((body as any)?.maxHangersPerSeller !== undefined) {
      updateFields.max_hangers_per_seller = Number((body as any)?.maxHangersPerSeller);
    }
    
    // Update the market
    const { data: updatedMarket, error: updateError } = await supabase
      .from("markets")
      .update(updateFields)
      .eq("id", marketId)
      .select(`
        id,
        name,
        description,
        picture_url,
        location_name,
        location_address,
        location_lat,
        location_lng,
        start_date,
        end_date,
        max_vendors,
        current_vendors,
        max_hangers,
        current_hangers,
        hanger_price,
        unlimited_hangers_per_seller,
        max_hangers_per_seller,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .single();
    
    if (updateError) {
      console.error("Error updating market:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update market",
          details: updateError.message
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
            id: updatedMarket.id,
            name: updatedMarket.name,
            description: updatedMarket.description,
            picture: (updatedMarket as any).picture_url,
            location: {
              name: updatedMarket.location_name,
              address: updatedMarket.location_address,
              lat: updatedMarket.location_lat,
              lng: updatedMarket.location_lng
            },
            dates: {
              start: updatedMarket.start_date,
              end: updatedMarket.end_date
            },
            capacity: {
              maxVendors: updatedMarket.max_vendors,
              currentVendors: updatedMarket.current_vendors,
              availableSpots: (updatedMarket as any).max_vendors - (updatedMarket as any).current_vendors,
              maxHangers: (updatedMarket as any).max_hangers || 0,
              currentHangers: (updatedMarket as any).current_hangers || 0,
              availableHangers: ((updatedMarket as any).max_hangers || 0) - ((updatedMarket as any).current_hangers || 0)
            },
            pricing: {
              hangerPrice: updatedMarket.hanger_price
            },
            policy: {
              unlimitedHangersPerSeller: (updatedMarket as any).unlimited_hangers_per_seller || false,
              maxHangersPerSeller: (updatedMarket as any).max_hangers_per_seller || 5
            },
            status: updatedMarket.status,
            createdBy: updatedMarket.created_by,
            createdAt: updatedMarket.created_at,
            updatedAt: updatedMarket.updated_at
          }
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin market update error:", error);
    
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
 * PATCH /api/admin/markets/[id]/status
 * Update market status (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    const marketId = params.id;
    
    // Validate UUID format
    const uuidSchema = z.string().uuid("Invalid market ID format");
    const validation = uuidSchema.safeParse(marketId);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid market ID format"
        },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const statusValidation = z.object({
      status: marketStatusSchema
    }).safeParse(body);
    
    if (!statusValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: statusValidation.error.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    const { status: newStatus } = statusValidation.data;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Check if market exists and get current status
    const { data: existingMarket, error: checkError } = await supabase
      .from("markets")
      .select("id, status, start_date, end_date")
      .eq("id", marketId)
      .single();
    
    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Market not found"
          },
          { status: 404 }
        );
      }
      
      console.error("Error checking market existence:", checkError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check market existence",
          details: checkError.message
        },
        { status: 500 }
      );
    }
    
    // Validate status transitions
    const currentStatus = existingMarket.status;
    const validTransitions: Record<string, string[]> = {
      "DRAFT": ["ACTIVE", "CANCELLED"],
      "ACTIVE": ["DRAFT", "COMPLETED", "CANCELLED"],
      "COMPLETED": [], // No transitions from completed
      "CANCELLED": [] // No transitions from cancelled
    };
    
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
          details: {
            currentStatus,
            newStatus,
            validTransitions: validTransitions[currentStatus] || []
          }
        },
        { status: 400 }
      );
    }
    
    // Additional validation for specific status changes
    // Note: Activation is now allowed regardless of start date
    // as it only controls seller registration, not market timing
    
    if (newStatus === "COMPLETED") {
      const now = new Date();
      const endDate = new Date(existingMarket.end_date);
      
      if (now < endDate) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot complete market before its end date"
          },
          { status: 400 }
        );
      }
    }
    
    // Update the market status
    const { data: updatedMarket, error: updateError } = await supabase
      .from("markets")
      .update({ status: newStatus })
      .eq("id", marketId)
      .select(`
        id,
        name,
        description,
        picture_url,
        location_name,
        location_address,
        location_lat,
        location_lng,
        start_date,
        end_date,
        max_vendors,
        current_vendors,
        max_hangers,
        current_hangers,
        hanger_price,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .single();
    
    if (updateError) {
      console.error("Error updating market status:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update market status",
          details: updateError.message
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
            id: updatedMarket.id,
            name: updatedMarket.name,
            description: updatedMarket.description,
            picture: (updatedMarket as any).picture_url,
            location: {
              name: updatedMarket.location_name,
              address: updatedMarket.location_address,
              lat: updatedMarket.location_lat,
              lng: updatedMarket.location_lng
            },
            dates: {
              start: updatedMarket.start_date,
              end: updatedMarket.end_date
            },
            capacity: {
              maxVendors: updatedMarket.max_vendors,
              currentVendors: updatedMarket.current_vendors
            },
            pricing: {
              hangerPrice: updatedMarket.hanger_price
            },
            status: updatedMarket.status,
            createdBy: updatedMarket.created_by,
            createdAt: updatedMarket.created_at,
            updatedAt: updatedMarket.updated_at
          },
          statusChange: {
            from: currentStatus,
            to: newStatus,
            timestamp: updatedMarket.updated_at
          }
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin market status update error:", error);
    
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
 * DELETE /api/admin/markets/[id]
 * Delete a market (Admin only) - Only if no active rentals or transactions
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    const marketId = params.id;
    
    // Validate UUID format
    const uuidSchema = z.string().uuid("Invalid market ID format");
    const validation = uuidSchema.safeParse(marketId);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid market ID format"
        },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Check if market exists
    const { data: existingMarket, error: checkError } = await supabase
      .from("markets")
      .select("id, name, status")
      .eq("id", marketId)
      .single();
    
    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Market not found"
          },
          { status: 404 }
        );
      }
      
      console.error("Error checking market existence:", checkError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check market existence",
          details: checkError.message
        },
        { status: 500 }
      );
    }
    
    // Check for dependencies
    const [
      { data: hangerRentals, error: rentalsError },
      { data: items, error: itemsError },
      { data: transactions, error: transactionsError }
    ] = await Promise.all([
      supabase
        .from("hanger_rentals")
        .select("id")
        .eq("market_id", marketId)
        .limit(1),
      
      supabase
        .from("items")
        .select("id")
        .eq("market_id", marketId)
        .limit(1),
      
      supabase
        .from("transactions")
        .select("id")
        .eq("market_id", marketId)
        .limit(1)
    ]);
    
    if (rentalsError) {
      console.error("Error checking hanger rentals:", rentalsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check market dependencies",
          details: rentalsError.message
        },
        { status: 500 }
      );
    }
    
    if (itemsError) {
      console.error("Error checking items:", itemsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check market dependencies",
          details: itemsError.message
        },
        { status: 500 }
      );
    }
    
    if (transactionsError) {
      console.error("Error checking transactions:", transactionsError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check market dependencies",
          details: transactionsError.message
        },
        { status: 500 }
      );
    }
    
    // Check if market can be deleted
    if (hangerRentals && hangerRentals.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete market with active hanger rentals",
          details: {
            hangerRentalsCount: hangerRentals.length
          }
        },
        { status: 409 }
      );
    }
    
    if (items && items.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete market with associated items",
          details: {
            itemsCount: items.length
          }
        },
        { status: 409 }
      );
    }
    
    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete market with associated transactions",
          details: {
            transactionsCount: transactions.length
          }
        },
        { status: 409 }
      );
    }
    
    // Only allow deletion of DRAFT and CANCELLED markets
    if (existingMarket.status !== "DRAFT" && existingMarket.status !== "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error: "Can only delete markets in DRAFT or CANCELLED status",
          details: {
            currentStatus: existingMarket.status,
            allowedStatuses: ["DRAFT", "CANCELLED"]
          }
        },
        { status: 409 }
      );
    }
    
    // Delete the market
    const { error: deleteError } = await supabase
      .from("markets")
      .delete()
      .eq("id", marketId);
    
    if (deleteError) {
      console.error("Error deleting market:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete market",
          details: deleteError.message
        },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Market deleted successfully",
          deletedMarket: {
            id: marketId,
            name: existingMarket.name
          }
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin market deletion error:", error);
    
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
