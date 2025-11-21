import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// CLEANUP EXPIRED CART ITEMS CRON JOB
// ============================================================================

/**
 * POST /api/cron/cleanup-expired-carts
 * Background job to clean up expired cart items
 * Returns items to RACK status via database triggers
 * 
 * This endpoint should be called by a cron job (e.g., Vercel Cron)
 * Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Cron secret not configured",
        },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Invalid cron secret");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    const now = new Date();

    // Find all expired cart items
    const { data: expiredItems, error: fetchError } = await supabase
      .from("cart_items")
      .select(`
        id,
        item_id,
        expires_at,
        items!inner(
          id,
          title,
          status
        )
      `)
      .lt("expires_at", now.toISOString());

    if (fetchError) {
      console.error("Fetch expired items error:", fetchError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch expired items",
          details: fetchError.message,
        },
        { status: 500 }
      );
    }

    if (!expiredItems || expiredItems.length === 0) {
      console.log("No expired cart items found");
      return NextResponse.json(
        {
          success: true,
          clearedCount: 0,
          timestamp: now.toISOString(),
          message: "No expired cart items to clean up",
        },
        { status: 200 }
      );
    }

    console.log(`Found ${expiredItems.length} expired cart items to clean up`);

    // Delete expired cart items (triggers will return items to RACK)
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .lt("expires_at", now.toISOString());

    if (deleteError) {
      console.error("Delete expired items error:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to clear expired items",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    // Log cleanup results
    const itemTitles = expiredItems.map((item) => {
      const itemData = item.items as any;
      return itemData?.title || "Unknown";
    });

    console.log(`Successfully cleared ${expiredItems.length} expired cart items:`, itemTitles);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        clearedCount: expiredItems.length,
        timestamp: now.toISOString(),
        message: `Cleared ${expiredItems.length} expired cart items`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cleanup expired carts cron error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

