import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MarketEnrollmentStatus } from "@/lib/markets/enrollment-status";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { data: { isRegistered: false, enrollment: null } },
        { status: 200 }
      );
    }

    const { data: existing } = await supabase
      .from("market_enrollments")
      .select("id, status, created_at")
      .eq("market_id", params.id)
      .eq("seller_id", user.id)
      .maybeSingle();

    const status = (existing?.status as MarketEnrollmentStatus | undefined) ?? null;

    return NextResponse.json(
      {
        data: {
          isRegistered: status === "APPROVED",
          enrollment: existing
            ? {
                id: existing.id,
                status,
                submittedAt: existing.created_at,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { data: { isRegistered: false, enrollment: null } },
      { status: 200 }
    );
  }
}
