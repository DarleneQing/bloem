import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const condition = searchParams.get("condition") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build query
    let query = supabase
      .from("items")
      .select(`
        *,
        owner:profiles!owner_id(
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        buyer:profiles!buyer_id(
          id,
          first_name,
          last_name,
          email
        ),
        market:markets(
          id,
          name,
          location_name,
          location_address
        )
      `);

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (condition) {
      query = query.eq("condition", condition);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: items, error: itemsError } = await query;

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
      return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("items")
      .select("*", { count: "exact", head: true });

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`);
    }

    if (status) {
      countQuery = countQuery.eq("status", status);
    }

    if (category) {
      countQuery = countQuery.eq("category", category);
    }

    if (condition) {
      countQuery = countQuery.eq("condition", condition);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting items:", countError);
      return NextResponse.json({ success: false, error: "Failed to count items" }, { status: 500 });
    }

    // Get item statistics
    const { data: stats, error: statsError } = await supabase
      .from("items")
      .select("status, category, condition, selling_price, created_at");

    if (statsError) {
      console.error("Error fetching stats:", statsError);
      return NextResponse.json({ success: false, error: "Failed to fetch statistics" }, { status: 500 });
    }

    // Calculate statistics
    const itemStats = {
      totalItems: count || 0,
      wardrobeItems: stats?.filter(item => item.status === "WARDROBE").length || 0,
      rackItems: stats?.filter(item => item.status === "RACK").length || 0,
      soldItems: stats?.filter(item => item.status === "SOLD").length || 0,
      totalValue: stats?.reduce((sum, item) => sum + (item.selling_price || 0), 0) || 0,
      averagePrice: stats?.filter(item => item.selling_price).length > 0 
        ? stats.filter(item => item.selling_price).reduce((sum, item) => sum + (item.selling_price || 0), 0) / stats.filter(item => item.selling_price).length
        : 0,
      recentItems: stats?.filter(item => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return new Date(item.created_at) > sevenDaysAgo;
      }).length || 0,
      categoryBreakdown: stats?.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      conditionBreakdown: stats?.reduce((acc, item) => {
        acc[item.condition] = (acc[item.condition] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    return NextResponse.json({
      success: true,
      data: {
        items: items || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        stats: itemStats
      }
    });

  } catch (error) {
    console.error("Admin items API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { itemId, updates } = body;

    if (!itemId) {
      return NextResponse.json({ success: false, error: "Item ID is required" }, { status: 400 });
    }

    // Update item
    const { data: updatedItem, error: updateError } = await supabase
      .from("items")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", itemId)
      .select(`
        *,
        owner:profiles!owner_id(
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        buyer:profiles!buyer_id(
          id,
          first_name,
          last_name,
          email
        ),
        market:markets(
          id,
          name,
          location_name,
          location_address
        )
      `)
      .single();

    if (updateError) {
      console.error("Error updating item:", updateError);
      return NextResponse.json({ success: false, error: "Failed to update item" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedItem
    });

  } catch (error) {
    console.error("Admin items update API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ success: false, error: "Item ID is required" }, { status: 400 });
    }

    // Delete item
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      console.error("Error deleting item:", deleteError);
      return NextResponse.json({ success: false, error: "Failed to delete item" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Item deleted successfully"
    });

  } catch (error) {
    console.error("Admin items delete API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
