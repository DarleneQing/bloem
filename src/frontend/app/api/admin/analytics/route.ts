import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";

// ============================================================================
// ADMIN ANALYTICS API
// ============================================================================

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics
 * Get comprehensive admin dashboard analytics (Admin only)
 */
export async function GET(_request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    // Create Supabase client
    const supabase = await createClient();
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all analytics data in parallel
    const [
      usersResult,
      recentUsersResult,
      marketsResult,
      itemsResult,
      transactionsResult,
      hangerRentalsResult,
      recentProfilesResult,
      recentItemsResult,
      recentTransactionsResult,
      weeklyProfilesResult,
    ] = await Promise.all([
      // Total users count
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString()),
      
      // Markets analytics
      supabase
        .from("markets")
        .select(`
          id,
          status,
          current_vendors,
          max_vendors,
          created_at,
          start_date,
          end_date
        `),
      
      // Items analytics
      supabase
        .from("items")
        .select(`
          id,
          status,
          created_at,
          updated_at
        `),
      
      // Transactions analytics
      supabase
        .from("transactions")
        .select(`
          id,
          status,
          total_amount,
          platform_fee,
          seller_amount,
          created_at
        `),
      
      // Hanger rentals analytics
      supabase
        .from("hanger_rentals")
        .select(`
          id,
          hanger_count,
          total_price,
          created_at
        `),

      supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("items")
        .select("id, title, thumbnail_url, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("transactions")
        .select("id, total_amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString()),
    ]);

    // Try to fetch QR codes separately (gracefully handle if table doesn't exist)
    let qrCodesCount = 0;
    try {
      const qrCodesResult = await supabase
        .from("qr_codes")
        .select("*", { count: "exact", head: true });
      qrCodesCount = qrCodesResult.count || 0;
    } catch (error) {
      console.log("QR codes table not found, skipping...");
    }
    
    // Handle errors
    if (usersResult.error) {
      console.error("Error fetching users:", usersResult.error);
    }
    if (marketsResult.error) {
      console.error("Error fetching markets:", marketsResult.error);
    }
    if (itemsResult.error) {
      console.error("Error fetching items:", itemsResult.error);
    }
    if (transactionsResult.error) {
      console.error("Error fetching transactions:", transactionsResult.error);
    }
    if (hangerRentalsResult.error) {
      console.error("Error fetching hanger rentals:", hangerRentalsResult.error);
    }
    
    // Calculate analytics
    const totalUsers = usersResult.count || 0;
    const markets = marketsResult.data || [];
    const items = itemsResult.data || [];
    const transactions = transactionsResult.data || [];
    const hangerRentals = hangerRentalsResult.data || [];
    const totalQrCodes = qrCodesCount;
    
    // Market analytics
    const totalMarkets = markets.length;
    const activeMarkets = markets.filter(m => m.status === "ACTIVE").length;
    const draftMarkets = markets.filter(m => m.status === "DRAFT").length;
    const completedMarkets = markets.filter(m => m.status === "COMPLETED").length;
    const cancelledMarkets = markets.filter(m => m.status === "CANCELLED").length;
    const totalVendors = markets.reduce((sum, m) => sum + (m.current_vendors || 0), 0);
    const totalCapacity = markets.reduce((sum, m) => sum + (m.max_vendors || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (totalVendors / totalCapacity) * 100 : 0;
    
    // Items analytics
    const totalItems = items.length;
    const wardrobeItems = items.filter(i => i.status === "WARDROBE").length;
    const rackItems = items.filter(i => i.status === "RACK").length;
    const soldItems = items.filter(i => i.status === "SOLD").length;
    
    // Transaction analytics
    const totalTransactions = transactions.length;
    const completedTransactions = transactions.filter(t => t.status === "COMPLETED");
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const totalPlatformFees = completedTransactions.reduce((sum, t) => sum + Number(t.platform_fee || 0), 0);
    const totalSellerEarnings = completedTransactions.reduce((sum, t) => sum + Number(t.seller_amount || 0), 0);
    
    // Hanger rental analytics
    const totalHangerRentals = hangerRentals.length;
    const totalHangersRented = hangerRentals.reduce((sum, r) => sum + (r.hanger_count || 0), 0);
    const totalHangerRevenue = hangerRentals.reduce((sum, r) => sum + Number(r.total_price || 0), 0);
    
    const recentUsers = recentUsersResult.count || 0;
    
    const recentMarkets = markets.filter(m => 
      new Date(m.created_at) >= thirtyDaysAgo
    ).length;
    
    const recentItems = items.filter(i => 
      new Date(i.created_at) >= thirtyDaysAgo
    ).length;
    
    const recentTransactions = completedTransactions.filter(t => 
      new Date(t.created_at) >= thirtyDaysAgo
    );
    const recentRevenue = recentTransactions.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    
    // Calculate growth rates (mock for now - would need historical data)
    const userGrowthRate = recentUsers > 0 ? Math.round((recentUsers / Math.max(totalUsers - recentUsers, 1)) * 100) : 0;
    const marketGrowthRate = recentMarkets > 0 ? Math.round((recentMarkets / Math.max(totalMarkets - recentMarkets, 1)) * 100) : 0;
    const revenueGrowthRate = recentRevenue > 0 ? Math.round((recentRevenue / Math.max(totalRevenue - recentRevenue, 1)) * 100) : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const revenueByDay: number[] = Array.from({ length: daysInMonth }, () => 0);

    for (const transaction of completedTransactions) {
      const createdAt = new Date(transaction.created_at);
      if (createdAt >= monthStart && createdAt <= monthEnd) {
        const dayIndex = createdAt.getDate() - 1;
        revenueByDay[dayIndex] += Number(transaction.total_amount || 0);
      }
    }

    const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];
    const usersByWeekday = Array.from({ length: 7 }, () => 0);
    const weeklyProfiles = weeklyProfilesResult.data || [];

    for (const profile of weeklyProfiles) {
      const createdAt = new Date(profile.created_at);
      const weekdayIndex = (createdAt.getDay() + 6) % 7;
      usersByWeekday[weekdayIndex] += 1;
    }

    const recentActivity = [
      ...(recentProfilesResult.data || []).map((profile) => ({
        id: `user-${profile.id}`,
        type: "user" as const,
        title: "New user registered",
        subtitle: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "New member",
        imageUrl: profile.avatar_url,
        createdAt: profile.created_at,
      })),
      ...(recentItemsResult.data || []).map((item) => ({
        id: `item-${item.id}`,
        type: "item" as const,
        title: item.status === "RACK" ? "Item listed on rack" : "Item updated",
        subtitle: item.title,
        imageUrl: item.thumbnail_url,
        createdAt: item.created_at,
      })),
      ...(recentTransactionsResult.data || []).map((transaction) => ({
        id: `transaction-${transaction.id}`,
        type: "transaction" as const,
        title:
          transaction.status === "COMPLETED"
            ? "Sale completed"
            : "Transaction updated",
        subtitle: `CHF ${Number(transaction.total_amount || 0).toLocaleString()}`,
        imageUrl: null,
        createdAt: transaction.created_at,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6);
    
    // Format response
    const analytics = {
      overview: {
        totalUsers,
        totalMarkets,
        totalItems,
        totalTransactions,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        platformFees: Math.round(totalPlatformFees * 100) / 100,
        sellerEarnings: Math.round(totalSellerEarnings * 100) / 100,
        totalHangerRentals,
        totalHangersRented,
        totalHangerRevenue: Math.round(totalHangerRevenue * 100) / 100,
        totalQrCodes
      },
      markets: {
        total: totalMarkets,
        active: activeMarkets,
        draft: draftMarkets,
        completed: completedMarkets,
        cancelled: cancelledMarkets,
        totalVendors,
        totalCapacity,
        utilizationRate: Math.round(utilizationRate * 100) / 100
      },
      items: {
        total: totalItems,
        wardrobe: wardrobeItems,
        rack: rackItems,
        sold: soldItems
      },
      transactions: {
        total: totalTransactions,
        completed: completedTransactions.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        platformFees: Math.round(totalPlatformFees * 100) / 100,
        sellerEarnings: Math.round(totalSellerEarnings * 100) / 100
      },
      growth: {
        users: {
          recent: recentUsers,
          growthRate: userGrowthRate
        },
        markets: {
          recent: recentMarkets,
          growthRate: marketGrowthRate
        },
        items: {
          recent: recentItems,
          growthRate: recentItems > 0 ? Math.round((recentItems / Math.max(totalItems - recentItems, 1)) * 100) : 0
        },
        revenue: {
          recent: Math.round(recentRevenue * 100) / 100,
          growthRate: revenueGrowthRate
        }
      },
      systemHealth: {
        uptime: 99.9, // Mock data - would come from monitoring system
        activeUsers: Math.round(totalUsers * 0.15), // Estimate 15% active
        systemLoad: 45 // Mock data
      },
      charts: {
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          growthRate: revenueGrowthRate,
          series: revenueByDay.map((value, index) => ({
            label: String(index + 1),
            value: Math.round(value * 100) / 100,
          })),
        },
        users: {
          total: totalUsers,
          growthRate: userGrowthRate,
          series: weekdayLabels.map((label, index) => ({
            label,
            value: usersByWeekday[index],
          })),
        },
      },
      recentActivity,
    };
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: analytics
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics data",
        details: error.message
      },
      { status: 500 }
    );
  }
}
