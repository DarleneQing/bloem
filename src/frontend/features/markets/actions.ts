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
    .select("id,status,max_vendors,current_vendors,max_hangers,current_hangers")
    .eq("id", id)
    .single();

  if (marketError || !market) {
    return { error: "Market not found" } as const;
  }

  if (market.status !== "ACTIVE") {
    return { error: "Market is not open for registration" } as const;
  }

  const vendorsAvailable = Number(market.current_vendors) < Number(market.max_vendors);
  const hangersAvailable = Number(market.current_hangers ?? 0) < Number(market.max_hangers ?? 0);
  
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

  // Guarded increment of current_vendors
  const { data: updated, error: updateError } = await supabase
    .from("markets")
    .update({ current_vendors: (market.current_vendors as number) + 1 })
    .eq("id", id)
    .lt("current_vendors", market.max_vendors as number)
    .lt("current_hangers", market.max_hangers ?? 0)
    .eq("status", "ACTIVE")
    .select("id,current_vendors")
    .single();

  if (updateError || !updated) {
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
