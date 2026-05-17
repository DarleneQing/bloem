import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MARKET_ENROLLMENT_STATUSES } from "@/lib/markets/enrollment-status";

const statusFilterSchema = z.enum([...MARKET_ENROLLMENT_STATUSES, "all"]).optional();

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

function formatSellerName(profile: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
} | null): string {
  if (!profile) return "Unknown seller";
  const full = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  return full || profile.email || "Unknown seller";
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const auth = await requireAdmin(supabase);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") ?? "all";
    const parsedStatus = statusFilterSchema.safeParse(statusParam);
    if (!parsedStatus.success) {
      return NextResponse.json({ success: false, error: "Invalid status filter" }, { status: 400 });
    }

    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("id, name, status, max_vendors, start_date, end_date")
      .eq("id", params.id)
      .maybeSingle();

    if (marketError || !market) {
      return NextResponse.json({ success: false, error: "Market not found" }, { status: 404 });
    }

    let enrollmentQuery = supabase
      .from("market_enrollments")
      .select("id, seller_id, status, created_at")
      .eq("market_id", params.id)
      .order("created_at", { ascending: false });

    if (parsedStatus.data && parsedStatus.data !== "all") {
      enrollmentQuery = enrollmentQuery.eq("status", parsedStatus.data);
    }

    const { data: enrollments, error: enrollmentsError } = await enrollmentQuery;

    if (enrollmentsError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    const sellerIds = Array.from(new Set((enrollments || []).map((e) => e.seller_id)));
    let profilesMap: Record<
      string,
      { first_name: string | null; last_name: string | null; email: string | null }
    > = {};

    if (sellerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", sellerIds);

      (profiles || []).forEach((profile) => {
        profilesMap[profile.id] = profile;
      });
    }

    const formatted = (enrollments || []).map((enrollment) => ({
      id: enrollment.id,
      status: enrollment.status,
      submittedAt: enrollment.created_at,
      seller: {
        id: enrollment.seller_id,
        name: formatSellerName(profilesMap[enrollment.seller_id] ?? null),
        email: profilesMap[enrollment.seller_id]?.email ?? null,
      },
    }));

    const { data: statusRows } = await supabase
      .from("market_enrollments")
      .select("status")
      .eq("market_id", params.id);

    const counts = (statusRows || []).reduce(
      (acc, row) => {
        const status = row.status as (typeof MARKET_ENROLLMENT_STATUSES)[number];
        if (MARKET_ENROLLMENT_STATUSES.includes(status)) {
          acc[status] += 1;
        }
        acc.all += 1;
        return acc;
      },
      { all: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        market: {
          id: market.id,
          name: market.name,
          status: market.status,
          maxVendors: market.max_vendors,
          dates: { start: market.start_date, end: market.end_date },
        },
        enrollments: formatted,
        counts,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch applications" }, { status: 500 });
  }
}
