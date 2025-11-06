import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  hangerCount: z.number().int().min(1).max(100),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .rpc("rpc_update_hanger_rental_quantity", { p_seller: user.id, p_rental: id, p_new_count: parsed.data.hangerCount })
      .single();

    if (error) {
      const msg = (error as any).message || "Failed to update hanger rental";
      const code = (error as any).code;
      const status = code === "23514" ? 409 : code === "40401" ? 404 : 500;
      return NextResponse.json({ success: false, error: msg }, { status });
    }

    return NextResponse.json({ success: true, data });
  } catch (_err: any) {
    return NextResponse.json({ success: false, error: "Failed to update hanger rental" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { error } = await supabase
      .rpc("rpc_cancel_hanger_rental", { p_seller: user.id, p_rental: id });

    if (error) {
      const msg = (error as any).message || "Failed to cancel hanger rental";
      const code = (error as any).code;
      const status = code === "40401" ? 404 : 500;
      return NextResponse.json({ success: false, error: msg }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (_err: any) {
    return NextResponse.json({ success: false, error: "Failed to cancel hanger rental" }, { status: 500 });
  }
}


