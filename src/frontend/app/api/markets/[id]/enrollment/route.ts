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

    let existing: { id: string; status?: MarketEnrollmentStatus; created_at: string } | null = null;

    const withStatus = await supabase
      .from("market_enrollments")
      .select("id, status, created_at")
      .eq("market_id", params.id)
      .eq("seller_id", user.id)
      .maybeSingle();

    if (withStatus.error && /status/i.test(withStatus.error.message)) {
      const legacy = await supabase
        .from("market_enrollments")
        .select("id, created_at")
        .eq("market_id", params.id)
        .eq("seller_id", user.id)
        .maybeSingle();
      if (legacy.data) {
        existing = { ...legacy.data, status: "APPROVED" };
      }
    } else {
      existing = withStatus.data;
    }

    const status =
      (existing?.status as MarketEnrollmentStatus | undefined) ??
      (existing ? "APPROVED" : null);

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
