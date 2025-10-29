import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createRentalSchema = z.object({
  marketId: z.string().uuid(),
  hangerCount: z.number().int().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = createRentalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }
    const { marketId, hangerCount } = parsed.data;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // Must be enrolled in the market
    const { data: enrollment } = await supabase
      .from("market_enrollments")
      .select("id")
      .eq("market_id", marketId)
      .eq("seller_id", user.id)
      .maybeSingle();
    if (!enrollment) {
      return NextResponse.json({ success: false, error: "Not enrolled in this market" }, { status: 403 });
    }

    // Use RPC to enforce atomic capacity and limits
    const { data, error } = await supabase
      .rpc("rpc_create_hanger_rental", { p_seller: user.id, p_market: marketId, p_count: hangerCount })
      .single();

    if (error) {
      const msg = (error as any).message || "Failed to create hanger rental";
      const code = (error as any).code;
      const status = code === "23514" ? 409 : code === "40401" ? 404 : code === "42501" ? 403 : 500;
      return NextResponse.json({ success: false, error: msg }, { status });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (_err: any) {
    return NextResponse.json({ success: false, error: "Failed to create hanger rental" }, { status: 500 });
  }
}


