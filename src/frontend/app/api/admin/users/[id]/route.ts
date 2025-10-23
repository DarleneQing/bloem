import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";

// ============================================================================
// ADMIN USER MANAGEMENT API
// ============================================================================

/**
 * GET /api/admin/users/[id]
 * Get specific user details (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get user profile
    const { data: user, error } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        address,
        role,
        wardrobe_status,
        iban,
        bank_name,
        account_holder_name,
        iban_verified_at,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq("id", params.id)
      .single();
    
    if (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    // Get additional user statistics
    const [
      { count: itemsCount },
      { count: transactionsCount },
      { count: marketsCount }
    ] = await Promise.all([
      // User's items
      supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", params.id),
      
      // User's transactions
      supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .or(`seller_id.eq.${params.id},buyer_id.eq.${params.id}`),
      
      // Markets created by user
      supabase
        .from("markets")
        .select("*", { count: "exact", head: true })
        .eq("created_by", params.id)
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        user,
        stats: {
          itemsCount: itemsCount || 0,
          transactionsCount: transactionsCount || 0,
          marketsCount: marketsCount || 0
        }
      }
    });
    
  } catch (error) {
    console.error("Get user API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update user details (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    const body = await request.json();
    const { first_name, last_name, phone, address, role, wardrobe_status } = body;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Update profile
    const { data: user, error } = await supabase
      .from("profiles")
      .update({
        first_name,
        last_name,
        phone: phone || null,
        address: address || null,
        role: role as "USER" | "ADMIN",
        wardrobe_status: wardrobe_status as "PUBLIC" | "PRIVATE",
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update user" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error("Update user API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user account (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Delete user from auth (this will cascade to profiles due to foreign key)
    const { error: authError } = await supabase.auth.admin.deleteUser(params.id);
    
    if (authError) {
      console.error("Error deleting user:", authError);
      return NextResponse.json(
        { success: false, error: "Failed to delete user" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "User deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete user API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
