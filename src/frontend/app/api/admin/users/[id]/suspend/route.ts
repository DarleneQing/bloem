import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";

/**
 * POST /api/admin/users/[id]/suspend
 * Toggle account suspension (reversible).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminServer();
    const supabase = await createClient();

    if (admin.id === params.id) {
      return NextResponse.json(
        { success: false, error: "You cannot suspend your own account" },
        { status: 400 }
      );
    }

    const { data: target, error: fetchError } = await supabase
      .from("profiles")
      .select("id, role, suspended_at")
      .eq("id", params.id)
      .single();

    if (fetchError || !target) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin accounts cannot be suspended" },
        { status: 400 }
      );
    }

    const suspend = target.suspended_at == null;
    const suspendedAt = suspend ? new Date().toISOString() : null;

    const { data: user, error: updateError } = await supabase
      .from("profiles")
      .update({
        suspended_at: suspendedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select("id, suspended_at")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update suspension status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        suspended: suspend,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
