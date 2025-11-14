import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/cron/cancel-overdue-rentals
 * 
 * Scheduled job endpoint to cancel pending hanger rentals older than 24 hours.
 * 
 * Security: Protected by CRON_SECRET token in Authorization header or query parameter.
 * 
 * This endpoint can be called by:
 * - Supabase Scheduled Jobs (pg_cron)
 * - Vercel Cron Jobs
 * - External cron services (GitHub Actions, etc.)
 * 
 * Usage:
 * - Header: Authorization: Bearer <CRON_SECRET>
 * - Query: ?secret=<CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  try {
    // Verify secret token
    const authHeader = request.headers.get("authorization");
    const querySecret = new URL(request.url).searchParams.get("secret");
    const providedSecret = authHeader?.replace("Bearer ", "") || querySecret;
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error("CRON_SECRET environment variable is not set");
      return NextResponse.json(
        { success: false, error: "Cron job not configured" },
        { status: 500 }
      );
    }

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials not configured");
      return NextResponse.json(
        { success: false, error: "Database not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Call the database function
    const { data, error } = await supabase.rpc("cancel_overdue_pending_hanger_rentals");

    if (error) {
      console.error("Error canceling overdue rentals:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to cancel overdue rentals",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Get count of cancelled rentals for logging
    const { count } = await supabase
      .from("hanger_rentals")
      .select("*", { count: "exact", head: true })
      .eq("status", "CANCELLED")
      .gte("updated_at", new Date(Date.now() - 60000).toISOString()); // Updated in last minute

    return NextResponse.json({
      success: true,
      message: "Overdue rentals cancelled successfully",
      cancelledCount: count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unexpected error in cancel-overdue-rentals cron:", error);
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

// Also support GET for easier testing and Supabase pg_cron HTTP calls
export async function GET(request: NextRequest) {
  return POST(request);
}

