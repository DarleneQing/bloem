import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }

  return { user };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ("error" in auth && auth.error) return auth.error;

  const marketId = params.id;

  const { data: sales, error: salesError } = await supabase
    .from("transactions")
    .select("seller_id, seller_amount")
    .eq("market_id", marketId)
    .eq("type", "PURCHASE")
    .eq("status", "COMPLETED");

  if (salesError) {
    return NextResponse.json({ error: salesError.message }, { status: 500 });
  }

  const { data: paid, error: paidError } = await supabase
    .from("payouts")
    .select("seller_id, amount, status")
    .eq("market_id", marketId)
    .in("status", ["REQUESTED", "PROCESSING", "COMPLETED"]);

  if (paidError) {
    return NextResponse.json({ error: paidError.message }, { status: 500 });
  }

  const owedBySeller = new Map<string, number>();
  for (const row of sales ?? []) {
    if (!row.seller_id) continue;
    const current = owedBySeller.get(row.seller_id) ?? 0;
    owedBySeller.set(row.seller_id, current + Number(row.seller_amount));
  }

  for (const row of paid ?? []) {
    const current = owedBySeller.get(row.seller_id) ?? 0;
    owedBySeller.set(row.seller_id, current - Number(row.amount));
  }

  const sellerIds = Array.from(owedBySeller.keys()).filter(
    (id) => (owedBySeller.get(id) ?? 0) > 0
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, stripe_account_id, stripe_payouts_enabled")
    .in("id", sellerIds.length ? sellerIds : ["00000000-0000-0000-0000-000000000000"]);

  const sellers = (profiles ?? []).map((p) => ({
    sellerId: p.id,
    name: `${p.first_name} ${p.last_name}`.trim(),
    email: p.email,
    stripeAccountId: p.stripe_account_id,
    stripeReady: p.stripe_payouts_enabled,
    amountOwed: Math.round((owedBySeller.get(p.id) ?? 0) * 100) / 100,
  }));

  return NextResponse.json({ data: { marketId, sellers } });
}
