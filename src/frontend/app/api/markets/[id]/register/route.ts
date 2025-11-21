import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // Check active seller via iban_verified_at
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, iban_verified_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    if (!profile.iban_verified_at) {
      return NextResponse.json({ success: false, error: "Seller not activated" }, { status: 403 });
    }

    // Fetch market
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("id,status,max_vendors,max_hangers")
      .eq("id", params.id)
      .single();

    if (marketError || !market) {
      return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
    }

    if (market.status !== "ACTIVE") {
      return NextResponse.json({ success: false, error: "Market is not open for registration" }, { status: 404 });
    }

    // Get live counts from enrollments and rentals
    const [{ count: vendorsCount }, { data: rentalsData }] = await Promise.all([
      supabase
        .from("market_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("market_id", params.id),
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
    const { data: existing, error: existingError } = await supabase
      .from("market_enrollments")
      .select("id")
      .eq("market_id", params.id)
      .eq("seller_id", user.id)
      .maybeSingle();

    if (existingError) {
      // proceed if not found error is not thrown; Supabase returns null on no rows
    }

    if (existing) {
      return NextResponse.json({ success: false, error: "Already registered" }, { status: 409 });
    }

    // Insert enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("market_enrollments")
      .insert({ market_id: params.id, seller_id: user.id })
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
        .eq("market_id", params.id),
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


