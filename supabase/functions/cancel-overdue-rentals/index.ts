import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

serve(async (req) => {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Call the database function
    const { data, error } = await supabase.rpc("cancel_overdue_pending_hanger_rentals")

    if (error) {
      console.error("Database function error:", error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to cancel overdue rentals",
          details: error.message 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get count of cancelled rentals for logging
    const { count } = await supabase
      .from("hanger_rentals")
      .select("*", { count: "exact", head: true })
      .eq("status", "CANCELLED")
      .gte("updated_at", new Date(Date.now() - 60000).toISOString()) // Updated in last minute

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
        details: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

