import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validations/schemas";

const itemStatusSchema = z.enum(["WARDROBE", "RACK", "SOLD"]);
const itemCategorySchema = z.enum([
  "TOPS",
  "BOTTOMS",
  "DRESSES",
  "OUTERWEAR",
  "SHOES",
  "ACCESSORIES",
  "BAGS",
  "JEWELRY",
  "OTHER",
]);
const itemConditionSchema = z.enum([
  "NEW_WITH_TAGS",
  "LIKE_NEW",
  "EXCELLENT",
  "GOOD",
  "FAIR",
]);
const itemSizeSchema = z.enum([
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "ONE_SIZE",
]);

const adminItemUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(5000).optional(),
    brand: z.string().max(100).nullable().optional(),
    category: itemCategorySchema.optional(),
    size: itemSizeSchema.nullable().optional(),
    condition: itemConditionSchema.optional(),
    color: z.string().max(50).nullable().optional(),
    selling_price: z.number().nonnegative().nullable().optional(),
    status: itemStatusSchema.optional(),
    image_urls: z.array(z.string().url()).optional(),
    thumbnail_url: z.string().url().optional(),
    market_id: uuidSchema.nullable().optional(),
    listed_at: z.string().datetime().nullable().optional(),
    sold_at: z.string().datetime().nullable().optional(),
  })
  .strict();

const adminItemPatchSchema = z.object({
  itemId: uuidSchema,
  updates: adminItemUpdateSchema,
});

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

    const rawBody = await request.json();
    const parsed = adminItemPatchSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { itemId, updates } = parsed.data;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No updatable fields provided" },
        { status: 400 }
      );
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from("items")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
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
    const rawItemId = searchParams.get("itemId");
    const parsedItemId = uuidSchema.safeParse(rawItemId);

    if (!parsedItemId.success) {
      return NextResponse.json(
        { success: false, error: "Valid item ID is required" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", parsedItemId.data);

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
