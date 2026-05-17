import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MARKET_ENROLLMENT_STATUSES } from "@/lib/markets/enrollment-status";

const updateSchema = z.object({
  status: z.enum(MARKET_ENROLLMENT_STATUSES),
});

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "ADMIN") {
    return { error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; enrollmentId: string } }
) {
  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    const { data: enrollment, error: fetchError } = await supabase
      .from("market_enrollments")
      .select("id, market_id, status")
      .eq("id", params.enrollmentId)
      .eq("market_id", params.id)
      .maybeSingle();

    if (fetchError || !enrollment) {
      return NextResponse.json({ success: false, error: "Enrollment not found" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("market_enrollments")
      .update({ status: parsed.data.status })
      .eq("id", params.enrollmentId)
      .select("id, status, created_at")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ success: false, error: "Failed to update enrollment" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        submittedAt: updated.created_at,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update enrollment" }, { status: 500 });
  }
}
