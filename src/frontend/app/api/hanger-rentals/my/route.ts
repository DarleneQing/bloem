import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("hanger_rentals")
      .select("id, market_id, seller_id, hanger_count, total_price, status, payment_confirmed_at, created_at, updated_at")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (_err: any) {
    return NextResponse.json({ success: false, error: "Failed to list rentals" }, { status: 500 });
  }
}


