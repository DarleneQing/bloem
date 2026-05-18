"use server";

import { createClient } from "@/lib/supabase/server";
import { isActiveSellerProfile } from "@/lib/auth/utils";
import { revalidatePath } from "next/cache";
import { registerMarketSchema, submitSellerApplicationSchema } from "./validations";
import type { SellerApplicationPayload } from "@/lib/markets/seller-application";
import type { MarketEnrollmentStatus } from "@/lib/markets/enrollment-status";
import { isMarketVisibleToUsers } from "@/lib/markets/user-visibility";

async function countApprovedVendors(supabase: Awaited<ReturnType<typeof createClient>>, marketId: string) {
  const { count } = await supabase
    .from("market_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("market_id", marketId)
    .eq("status", "APPROVED");
  return count ?? 0;
}

export async function submitSellerMarketApplication(input: SellerApplicationPayload & { marketId: string }) {
  const parsed = submitSellerApplicationSchema.parse({
    marketId: input.marketId,
    stylePhotoUrls: input.stylePhotoUrls,
    socialMediaConsent: input.socialMediaConsent,
    itemCount: input.itemCount,
    itemCountRange: input.itemCountRange,
    brandIds: input.brandIds,
    wantsToVolunteer: input.wantsToVolunteer,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, iban_verified_at, stripe_payouts_enabled")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" } as const;
  }

  if (!isActiveSellerProfile(profile)) {
    return { error: "Seller not activated" } as const;
  }

  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("id, status, end_date, max_vendors, max_hangers")
    .eq("id", parsed.marketId)
    .single();

  if (marketError || !market || !isMarketVisibleToUsers(market)) {
    return { error: "Market not found" } as const;
  }

  const applicationRow = {
    style_photo_urls: parsed.stylePhotoUrls,
    social_media_consent: parsed.socialMediaConsent,
    item_count: parsed.itemCount,
    item_count_range: parsed.itemCountRange,
    brand_ids: parsed.brandIds,
    wants_to_volunteer: parsed.wantsToVolunteer,
    status: "PENDING" as const,
  };

  const { data: existing } = await supabase
    .from("market_enrollments")
    .select("id, status")
    .eq("market_id", parsed.marketId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (existing) {
    const existingStatus = existing.status as MarketEnrollmentStatus;
    if (existingStatus === "PENDING") {
      const { data: updated, error: updateError } = await supabase
        .from("market_enrollments")
        .update(applicationRow)
        .eq("id", existing.id)
        .select("id, status, created_at")
        .single();

      if (updateError || !updated) {
        return { error: "Failed to submit application" } as const;
      }

      revalidatePath("/markets");
      revalidatePath(`/markets/${parsed.marketId}`);
      return {
        data: {
          id: updated.id,
          status: updated.status as MarketEnrollmentStatus,
          submittedAt: updated.created_at,
        },
      } as const;
    }
    if (existingStatus === "APPROVED") {
      return { error: "Already registered" } as const;
    }
    if (existingStatus === "REJECTED") {
      const { data: updated, error: updateError } = await supabase
        .from("market_enrollments")
        .update(applicationRow)
        .eq("id", existing.id)
        .select("id, status, created_at")
        .single();

      if (updateError || !updated) {
        return { error: "Failed to submit application" } as const;
      }

      revalidatePath("/markets");
      revalidatePath(`/markets/${parsed.marketId}`);
      return {
        data: {
          id: updated.id,
          status: updated.status as MarketEnrollmentStatus,
          submittedAt: updated.created_at,
        },
      } as const;
    }
  }

  const [{ data: rentalsData }, currentVendors] = await Promise.all([
    supabase
      .from("hanger_rentals")
      .select("hanger_count, status")
      .eq("market_id", parsed.marketId)
      .in("status", ["PENDING", "CONFIRMED"]),
    countApprovedVendors(supabase, parsed.marketId),
  ]);

  const currentHangers = Array.isArray(rentalsData)
    ? rentalsData.reduce((sum, r) => sum + Number(r.hanger_count || 0), 0)
    : 0;

  const vendorsAvailable = currentVendors < Number(market.max_vendors);
  const hangersAvailable = currentHangers < Number(market.max_hangers ?? 0);

  if (!vendorsAvailable || !hangersAvailable) {
    return { error: "Market is full" } as const;
  }

  const withStatus = await supabase
    .from("market_enrollments")
    .insert({
      market_id: parsed.marketId,
      seller_id: user.id,
      ...applicationRow,
    })
    .select("id, status, created_at")
    .single();

  if (withStatus.error) {
    if (withStatus.error.code === "23505") {
      return { error: "Application already submitted" } as const;
    }
    return { error: withStatus.error.message } as const;
  }

  const enrollment = withStatus.data;
  if (!enrollment) {
    return { error: "Failed to submit application" } as const;
  }

  revalidatePath("/markets");
  revalidatePath(`/markets/${parsed.marketId}`);
  return {
    data: {
      id: enrollment.id,
      status: enrollment.status as MarketEnrollmentStatus,
      submittedAt: enrollment.created_at,
    },
  } as const;
}

export async function registerForMarket(marketId: string) {
  const { marketId: id } = registerMarketSchema.parse({ marketId });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" } as const;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, iban_verified_at, stripe_payouts_enabled")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" } as const;
  }

  if (!isActiveSellerProfile(profile)) {
    return { error: "Seller not activated" } as const;
  }

  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("id,status,end_date,max_vendors,max_hangers")
    .eq("id", id)
    .single();

  if (marketError || !market || !isMarketVisibleToUsers(market)) {
    return { error: "Market not found" } as const;
  }

  const [{ data: rentalsData }, currentVendors] = await Promise.all([
    supabase
      .from("hanger_rentals")
      .select("hanger_count,status")
      .eq("market_id", id)
      .in("status", ["PENDING", "CONFIRMED"]),
    countApprovedVendors(supabase, id),
  ]);

  const currentHangers = Array.isArray(rentalsData)
    ? rentalsData.reduce((sum, r) => sum + Number(r.hanger_count || 0), 0)
    : 0;

  const vendorsAvailable = currentVendors < Number(market.max_vendors);
  const hangersAvailable = currentHangers < Number(market.max_hangers ?? 0);

  if (!vendorsAvailable || !hangersAvailable) {
    return { error: "Market is full" } as const;
  }

  const { data: existing } = await supabase
    .from("market_enrollments")
    .select("id, status")
    .eq("market_id", id)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (existing) {
    const existingStatus = existing.status as MarketEnrollmentStatus;
    if (existingStatus === "PENDING") {
      return { error: "Application already submitted" } as const;
    }
    if (existingStatus === "APPROVED") {
      return { error: "Already registered" } as const;
    }
    if (existingStatus === "REJECTED") {
      const { data: updated, error: updateError } = await supabase
        .from("market_enrollments")
        .update({ status: "PENDING" })
        .eq("id", existing.id)
        .select("id, status, created_at")
        .single();

      if (updateError || !updated) {
        return { error: "Failed to submit application" } as const;
      }

      revalidatePath("/markets");
      return {
        data: {
          id: updated.id,
          status: updated.status as MarketEnrollmentStatus,
          submittedAt: updated.created_at,
        },
      } as const;
    }
  }

  let enrollment: { id: string; status: string; created_at: string } | null = null;
  let enrollError: { message: string; code?: string } | null = null;

  const withStatus = await supabase
    .from("market_enrollments")
    .insert({ market_id: id, seller_id: user.id, status: "PENDING" })
    .select("id, status, created_at")
    .single();

  if (withStatus.error && /status/i.test(withStatus.error.message)) {
    const legacy = await supabase
      .from("market_enrollments")
      .insert({ market_id: id, seller_id: user.id })
      .select("id, created_at")
      .single();
    enrollment = legacy.data
      ? { id: legacy.data.id, status: "APPROVED", created_at: legacy.data.created_at }
      : null;
    enrollError = legacy.error;
  } else {
    enrollment = withStatus.data;
    enrollError = withStatus.error;
  }

  if (enrollError) {
    if (enrollError.code === "23505") {
      return { error: "Already registered" } as const;
    }
    return { error: enrollError.message } as const;
  }

  if (!enrollment) {
    return { error: "Failed to submit application" } as const;
  }

  const vendorsAfter = await countApprovedVendors(supabase, id);
  const { data: rentalsDataAfter } = await supabase
    .from("hanger_rentals")
    .select("hanger_count,status")
    .eq("market_id", id)
    .in("status", ["PENDING", "CONFIRMED"]);

  const currentHangersAfter = Array.isArray(rentalsDataAfter)
    ? rentalsDataAfter.reduce((sum, r) => sum + Number(r.hanger_count || 0), 0)
    : 0;

  if (vendorsAfter > Number(market.max_vendors) || currentHangersAfter >= Number(market.max_hangers ?? 0)) {
    await supabase.from("market_enrollments").delete().eq("id", enrollment.id);
    return { error: "Market capacity reached" } as const;
  }

  revalidatePath("/markets");
  return {
    data: {
      id: enrollment.id,
      status: enrollment.status as MarketEnrollmentStatus,
      submittedAt: enrollment.created_at,
    },
  } as const;
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

  const { data: existing, error: existingError } = await supabase
    .from("market_enrollments")
    .select("id, status")
    .eq("market_id", id)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: "Not registered for this market" } as const;
  }

  const { data: market, error: marketError } = await supabase
    .from("markets")
    .select("id,current_vendors")
    .eq("id", id)
    .single();

  if (marketError || !market) {
    return { error: "Market not found" } as const;
  }

  const { error: deleteError } = await supabase.from("market_enrollments").delete().eq("id", existing.id);

  if (deleteError) {
    return { error: "Failed to deregister" } as const;
  }

  if ((existing.status as MarketEnrollmentStatus) === "APPROVED") {
    const newCurrentVendors = Math.max(0, (market.current_vendors as number) - 1);
    await supabase.from("markets").update({ current_vendors: newCurrentVendors }).eq("id", id);
  }

  revalidatePath("/markets");
  return { success: true } as const;
}
