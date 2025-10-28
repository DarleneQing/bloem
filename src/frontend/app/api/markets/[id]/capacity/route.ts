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

    const vendors = {
      max: m.max_vendors,
      current: m.current_vendors,
      available: Math.max(0, Number(m.max_vendors) - Number(m.current_vendors)),
    };
    const hangers = {
      max: (m as any).max_hangers ?? 0,
      current: (m as any).current_hangers ?? 0,
      available: Math.max(0, Number((m as any).max_hangers ?? 0) - Number((m as any).current_hangers ?? 0)),
    };

    return NextResponse.json({ success: true, data: { vendors, hangers } });
  } catch (_err: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch capacity" }, { status: 500 });
  }
}


