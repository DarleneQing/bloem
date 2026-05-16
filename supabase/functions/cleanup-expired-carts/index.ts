// @ts-ignore: Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore: Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// @ts-ignore: Deno namespace
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
// @ts-ignore: Deno namespace
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
// @ts-ignore: Deno namespace
const CRON_SECRET = Deno.env.get("CRON_SECRET") || ""

// pg_cron (migration 027) is the live cleanup path. This function is retained
// as a manual recovery trigger; it must not be world-callable.
serve(async (req) => {
  if (!CRON_SECRET) {
    return new Response(
      JSON.stringify({ error: "CRON_SECRET is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const authHeader = req.headers.get("Authorization") || ""
  const expected = `Bearer ${CRON_SECRET}`
  if (authHeader !== expected) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: deletedCount, error } = await supabase.rpc("cleanup_expired_cart_items")

    if (error) {
      console.error("Database function error:", error)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to cleanup expired cart items",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Expired cart items cleaned up successfully",
        clearedCount: deletedCount || 0,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in cleanup-expired-carts function:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
