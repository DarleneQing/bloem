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

// Constant-time string compare — avoids leaking secret length/prefix via
// response-time differences on a naive `===` scan.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// pg_cron is the live caller of cancel_overdue_pending_hanger_rentals().
// This function is retained as a manual recovery trigger only.
serve(async (req) => {
  if (!CRON_SECRET) {
    return new Response(
      JSON.stringify({ error: "CRON_SECRET is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const authHeader = req.headers.get("Authorization") || ""
  const expected = `Bearer ${CRON_SECRET}`
  if (!timingSafeEqual(authHeader, expected)) {
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

    const { error } = await supabase.rpc("cancel_overdue_pending_hanger_rentals")

    if (error) {
      console.error("Database function error:", error)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to cancel overdue rentals",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const { count } = await supabase
      .from("hanger_rentals")
      .select("*", { count: "exact", head: true })
      .eq("status", "CANCELLED")
      .gte("updated_at", new Date(Date.now() - 60000).toISOString())

    return new Response(
      JSON.stringify({
        success: true,
        message: "Overdue rentals cancelled successfully",
        cancelledCount: count || 0,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in cancel-overdue-rentals function:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
