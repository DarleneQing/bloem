import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";
import { syncProfile as syncMarketingAudience } from "@/lib/email/audiences";

// ============================================================================
// ADMIN USER ROLE MANAGEMENT API
// ============================================================================

/**
 * PATCH /api/admin/users/[id]/role
 * Update user role (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    const body = await request.json();
    const { role } = body;
    
    // Validate role
    if (!role || !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be USER or ADMIN" },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Update user role
    const { data: user, error } = await supabase
      .from("profiles")
      .update({
        role: role as "USER" | "ADMIN",
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating user role:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update user role" },
        { status: 500 }
      );
    }

    // Role change shifts the marketing segment (USER ↔ admin audience).
    // Best-effort: never let an audience sync error break the admin response.
    try {
      const { data: fresh } = await supabase
        .from("profiles")
        .select(
          "email, first_name, last_name, role, stripe_account_id, stripe_payouts_enabled, marketing_consent, marketing_unsubscribe_token, suspended_at"
        )
        .eq("id", params.id)
        .single();
      if (fresh) {
        await syncMarketingAudience(fresh);
      }
    } catch (syncError) {
      console.error("Marketing audience sync failed (non-fatal):", syncError);
    }

    return NextResponse.json({
      success: true,
      data: { user },
      message: `User role updated to ${role}`
    });
    
  } catch (error) {
    console.error("Update user role API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
