import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";

// ============================================================================
// ADMIN USER SELLER STATUS MANAGEMENT API
// ============================================================================

/**
 * PATCH /api/admin/users/[id]/seller-status
 * Toggle seller verification status (Admin only)
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get current user data
    const { data: user, error: fetchError } = await supabase
      .from("profiles")
      .select("iban_verified_at, iban, bank_name, account_holder_name")
      .eq("id", params.id)
      .single();
    
    if (fetchError) {
      console.error("Error fetching user:", fetchError);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user has seller information
    if (!user.iban || !user.bank_name || !user.account_holder_name) {
      return NextResponse.json(
        { success: false, error: "User must have complete seller information (IBAN, bank name, account holder name) before verification" },
        { status: 400 }
      );
    }
    
    // Toggle verification status
    const newVerificationStatus = user.iban_verified_at ? null : new Date().toISOString();
    
    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update({
        iban_verified_at: newVerificationStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating seller status:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update seller status" },
        { status: 500 }
      );
    }
    
    const action = newVerificationStatus ? "verified" : "unverified";
    
    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: `Seller status ${action} successfully`
    });
    
  } catch (error) {
    console.error("Update seller status API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
