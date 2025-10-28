import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";

// ============================================================================
// ADMIN USERS API
// ============================================================================

/**
 * GET /api/admin/users
 * Get all users with pagination and filtering (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Admin users API: Starting request");
    
    // Require admin authentication
    await requireAdminServer();
    console.log("Admin users API: Authentication successful");
    
    // Create Supabase client
    const supabase = await createClient();
    console.log("Admin users API: Supabase client created");
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
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
      .order("created_at", { ascending: false });
    
    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    
    if (role && role !== "all") {
      query = query.eq("role", role);
    }
    
    if (status === "verified_sellers") {
      query = query.not("iban_verified_at", "is", null);
    } else if (status === "recent") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte("created_at", sevenDaysAgo.toISOString());
    }
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data: users, error } = await query;
    console.log("Admin users API: Query executed, users count:", users?.length || 0);
    
    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users" },
        { status: 500 }
      );
    }
    
    // Get additional statistics
    const [
      { count: totalUsers },
      { count: adminUsers },
      { count: verifiedSellers },
      { count: recentSignups }
    ] = await Promise.all([
      // Total users
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      
      // Admin users
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "ADMIN"),
      
      // Verified sellers
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .not("iban_verified_at", "is", null),
      
      // Recent signups (last 7 days)
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ]);
    
    // Calculate active users (users who have items or transactions)
    // Simplified query to avoid potential issues
    let activeUsers = 0;
    try {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .or("id.in.(select owner_id from items),id.in.(select buyer_id from transactions)");
      activeUsers = count || 0;
    } catch (activeUsersError) {
      console.warn("Could not calculate active users:", activeUsersError);
      activeUsers = 0;
    }
    
    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      adminUsers: adminUsers || 0,
      verifiedSellers: verifiedSellers || 0,
      recentSignups: recentSignups || 0
    };
    
    console.log("Admin users API: Stats calculated:", stats);
    
    const response = {
      success: true,
      data: {
        users: users || [],
        stats,
        pagination: {
          page,
          limit,
          totalCount: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit)
        }
      }
    };
    
    console.log("Admin users API: Returning response:", response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    const body = await request.json();
    const { email, password, first_name, last_name, phone, address, role = "USER" } = body;
    
    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: "Email, password, first name, and last name are required" },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name
      }
    });
    
    if (authError) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json(
        { success: false, error: "Failed to create user account" },
        { status: 400 }
      );
    }
    
    // Update profile with additional data
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name,
        last_name,
        phone: phone || null,
        address: address || null,
        role: role as "USER" | "ADMIN"
      })
      .eq("id", authData.user.id);
    
    if (profileError) {
      console.error("Error updating profile:", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to update user profile" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          first_name,
          last_name,
          phone,
          address,
          role,
          created_at: authData.user.created_at
        }
      }
    });
    
  } catch (error) {
    console.error("Create user API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
