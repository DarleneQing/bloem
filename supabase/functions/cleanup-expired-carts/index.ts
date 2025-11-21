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

    // Call the database function to cleanup expired cart items
    const { data: deletedCount, error } = await supabase.rpc("cleanup_expired_cart_items")

    if (error) {
      console.error("Database function error:", error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to cleanup expired cart items",
          details: error.message 
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
        details: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

