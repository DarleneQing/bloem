import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: m, error } = await supabase
      .from("markets")
      .select("id,max_vendors,current_vendors,max_hangers,current_hangers")
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
    }

    // Live vendor occupancy: count enrollments for this market
    const { count: vendorsCurrentCount } = await supabase
      .from("market_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("market_id", params.id);

    const vendorsMax = Number(m.max_vendors ?? 0);
    const vendorsCurrent = Number(vendorsCurrentCount ?? m.current_vendors ?? 0);
    const hangersMax = Number((m as any).max_hangers ?? 0);
    // Live hangers occupancy: sum PENDING + CONFIRMED rentals for this market
    const { data: hangerSums } = await supabase
      .from("hanger_rentals")
      .select("hanger_count")
      .eq("market_id", params.id)
      .in("status", ["PENDING", "CONFIRMED"]);
    const hangersCurrent = Array.isArray(hangerSums)
      ? hangerSums.reduce((sum: number, r: any) => sum + Number(r.hanger_count || 0), 0)
      : Number((m as any).current_hangers ?? 0);

    const vendors = {
      max: vendorsMax,
      current: vendorsCurrent,
      available: Math.max(0, vendorsMax - vendorsCurrent),
    };
    const hangers = {
      max: hangersMax,
      current: hangersCurrent,
      available: Math.max(0, hangersMax - hangersCurrent),
    };

    return NextResponse.json({ success: true, data: { vendors, hangers } });
  } catch (_err: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch capacity" }, { status: 500 });
  }
}


