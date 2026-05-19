import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ marketIds: [] });
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("market_id")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ marketIds: [] });
  }

  const marketIds = (data ?? []).map((row) => row.market_id as string);
  return NextResponse.json({ marketIds });
}
