import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ data: { isRegistered: false } }, { status: 200 });
    }

    const { data: existing } = await supabase
      .from("market_enrollments")
      .select("id")
      .eq("market_id", params.id)
      .eq("seller_id", user.id)
      .maybeSingle();

    return NextResponse.json({ 
      data: { 
        isRegistered: !!existing 
      } 
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ data: { isRegistered: false } }, { status: 200 });
  }
}

