import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isActiveSellerProfile } from "@/lib/auth/utils";
import {
  isMarketVisibleToUsers,
  userVisibleMarketsEndDateMin,
  USER_VISIBLE_MARKET_STATUS,
} from "@/lib/markets/user-visibility";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, stripe_payouts_enabled")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    if (!isActiveSellerProfile(profile)) {
      return NextResponse.json({ success: false, error: "Seller not activated" }, { status: 403 });
    }

    // Fetch market
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("id,status,end_date,max_vendors,max_hangers")
      .eq("id", params.id)
      .eq("status", USER_VISIBLE_MARKET_STATUS)
      .gte("end_date", userVisibleMarketsEndDateMin())
      .single();

    if (marketError || !market || !isMarketVisibleToUsers(market)) {
      return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
    }

    // Get live counts from enrollments and rentals
    const [{ count: vendorsCount }, { data: rentalsData }] = await Promise.all([
      supabase
        .from("market_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("market_id", params.id)
        .eq("status", "APPROVED"),
      supabase
        .from("hanger_rentals")
        .select("hanger_count,status")
        .eq("market_id", params.id)
        .in("status", ["PENDING", "CONFIRMED"])
    ]);

    const currentVendors = vendorsCount ?? 0;
    const currentHangers = Array.isArray(rentalsData)
      ? rentalsData.reduce((sum, r) => sum + Number(r.hanger_count || 0), 0)
      : 0;

    const vendorsAvailable = currentVendors < Number(market.max_vendors);
    const hangersAvailable = currentHangers < Number((market as any).max_hangers ?? 0);
    
    if (!vendorsAvailable || !hangersAvailable) {
      return NextResponse.json({ success: false, error: "Market is full" }, { status: 409 });
    }

    // Check duplicate enrollment
    const { data: existing } = await supabase
      .from("market_enrollments")
      .select("id, status")
      .eq("market_id", params.id)
      .eq("seller_id", user.id)
      .maybeSingle();

    if (existing?.status === "PENDING") {
      return NextResponse.json({ success: false, error: "Application already submitted" }, { status: 409 });
    }

    if (existing?.status === "APPROVED") {
      return NextResponse.json({ success: false, error: "Already registered" }, { status: 409 });
    }

    if (existing?.status === "REJECTED") {
      const { error: updateError } = await supabase
        .from("market_enrollments")
        .update({ status: "PENDING" })
        .eq("id", existing.id);
      if (updateError) {
        return NextResponse.json({ success: false, error: "Failed to submit application" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const { data: enrollment, error: enrollError } = await supabase
      .from("market_enrollments")
      .insert({ market_id: params.id, seller_id: user.id, status: "PENDING" })
      .select("id")
      .single();

    if (enrollError) {
      if ((enrollError as any).code === "23505") {
        return NextResponse.json({ success: false, error: "Already registered" }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: enrollError.message }, { status: 500 });
    }

    // Verify capacity again after insertion (race condition check)
    const [{ count: vendorsCountAfter }, { data: rentalsDataAfter }] = await Promise.all([
      supabase
        .from("market_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("market_id", params.id)
        .eq("status", "APPROVED"),
      supabase
        .from("hanger_rentals")
        .select("hanger_count,status")
        .eq("market_id", params.id)
        .in("status", ["PENDING", "CONFIRMED"])
    ]);

    const currentVendorsAfter = vendorsCountAfter ?? 0;
    const currentHangersAfter = Array.isArray(rentalsDataAfter)
      ? rentalsDataAfter.reduce((sum, r) => sum + Number(r.hanger_count || 0), 0)
      : 0;

    // Final capacity check after enrollment insertion
    if (currentVendorsAfter > Number(market.max_vendors) || currentHangersAfter >= Number((market as any).max_hangers ?? 0)) {
      // Compensation: remove enrollment we just inserted
      await supabase.from("market_enrollments").delete().eq("id", enrollment.id);
      return NextResponse.json({ success: false, error: "Market capacity reached" }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 });
  }
}


