"use server";

import { createClient } from "@/lib/supabase/server";
import { getMyItemsStats } from "@/features/items/queries";

export interface ProfileSellerStats {
  itemsUploaded: number;
  itemsSold: number;
  totalEarnings: number;
}

export interface PurchaseTransaction {
  id: string;
  type: string;
  status: string;
  total_amount: number;
  platform_fee: number;
  seller_amount: number;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  item: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    category: string | null;
    status: string;
  } | null;
  seller: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  market: {
    id: string;
    name: string;
  } | null;
}

export async function getMyPurchaseHistory(): Promise<PurchaseTransaction[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      type,
      status,
      total_amount,
      platform_fee,
      seller_amount,
      stripe_payment_intent_id,
      created_at,
      updated_at,
      item:items(id, title, thumbnail_url, category, status),
      seller:profiles!transactions_seller_id_fkey(id, first_name, last_name, avatar_url),
      market:markets(id, name)
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch purchase history:", error);
    return [];
  }

  return (data ?? []) as unknown as PurchaseTransaction[];
}

export async function getProfileSellerStats(): Promise<ProfileSellerStats> {
  const itemStats = await getMyItemsStats();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { itemsUploaded: 0, itemsSold: 0, totalEarnings: 0 };
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("seller_amount")
    .eq("seller_id", user.id)
    .eq("status", "COMPLETED");

  const totalEarnings =
    transactions?.reduce((sum, row) => sum + Number(row.seller_amount ?? 0), 0) ?? 0;

  return {
    itemsUploaded: itemStats?.total ?? 0,
    itemsSold: itemStats?.sold ?? 0,
    totalEarnings,
  };
}
