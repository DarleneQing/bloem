"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { registerMarketSchema } from "./validations";

export async function registerForMarket(marketId: string) {
  const { marketId: id } = registerMarketSchema.parse({ marketId });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  // Check active seller via iban_verified_at
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, iban_verified_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" } as const;
  }

  if (!profile.iban_verified_at) {
    return { error: "Seller not activated" } as const;
  }

  // Fetch market
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("id,status,max_vendors,max_hangers")
    .eq("id", id)
    .single();

  if (marketError || !market) {
    return { error: "Market not found" } as const;
  }

  if (market.status !== "ACTIVE") {
    return { error: "Market is not open for registration" } as const;
  }

  // Get live counts from enrollments and rentals
  const [{ count: vendorsCount }, { data: rentalsData }] = await Promise.all([
    supabase
      .from("market_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("market_id", id),
    supabase
      .from("hanger_rentals")
      .select("hanger_count,status")
      .eq("market_id", id)
      .in("status", ["PENDING", "CONFIRMED"])
  ]);

  const currentVendors = vendorsCount ?? 0;
  const currentHangers = Array.isArray(rentalsData)
    ? rentalsData.reduce((sum, r) => sum + Number(r.hanger_count || 0), 0)
    : 0;

  const vendorsAvailable = currentVendors < Number(market.max_vendors);
  const hangersAvailable = currentHangers < Number(market.max_hangers ?? 0);
  
  if (!vendorsAvailable || !hangersAvailable) {
    return { error: "Market is full" } as const;
  }

  // Check duplicate enrollment
  const { data: existing } = await supabase
    .from("market_enrollments")
    .select("id")
    .eq("market_id", id)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "Already registered" } as const;
  }

  // Insert enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from("market_enrollments")
    .insert({ market_id: id, seller_id: user.id })
    .select("id")
    .single();

  if (enrollError) {
    if ((enrollError as any).code === "23505") {
      return { error: "Already registered" } as const;
    }
    return { error: enrollError.message } as const;
  }

  // Verify capacity again after insertion (race condition check)
  const [{ count: vendorsCountAfter }, { data: rentalsDataAfter }] = await Promise.all([
    supabase
      .from("market_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("market_id", id),
    supabase
      .from("hanger_rentals")
      .select("hanger_count,status")
      .eq("market_id", id)
      .in("status", ["PENDING", "CONFIRMED"])
  ]);

  const currentVendorsAfter = vendorsCountAfter ?? 0;
  const currentHangersAfter = Array.isArray(rentalsDataAfter)
    ? rentalsDataAfter.reduce((sum, r) => sum + Number(r.hanger_count || 0), 0)
    : 0;

  // Final capacity check after enrollment insertion
  if (currentVendorsAfter > Number(market.max_vendors) || currentHangersAfter >= Number(market.max_hangers ?? 0)) {
    // Compensation: remove enrollment we just inserted
    await supabase.from("market_enrollments").delete().eq("id", enrollment.id);
    return { error: "Market capacity reached" } as const;
  }

  revalidatePath("/markets");
  return { success: true } as const;
}

export async function unregisterForMarket(marketId: string) {
  const { marketId: id } = registerMarketSchema.parse({ marketId });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  // Check existing enrollment
  const { data: existing, error: existingError } = await supabase
    .from("market_enrollments")
    .select("id")
    .eq("market_id", id)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: "Not registered for this market" } as const;
  }

  // Fetch market
  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("id,current_vendors")
    .eq("id", id)
    .single();

  if (marketError || !market) {
    return { error: "Market not found" } as const;
  }

  // Delete enrollment
  const { error: deleteError } = await supabase
    .from("market_enrollments")
    .delete()
    .eq("id", existing.id);

  if (deleteError) {
    return { error: "Failed to deregister" } as const;
  }

  // Decrement current_vendors
  const newCurrentVendors = Math.max(0, (market.current_vendors as number) - 1);
  await supabase
    .from("markets")
    .update({ current_vendors: newCurrentVendors })
    .eq("id", id);

  revalidatePath("/markets");
  return { success: true } as const;
}
