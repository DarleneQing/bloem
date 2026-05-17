"use server";

import { createClient } from "@/lib/supabase/server";
import { getMyItemsStats } from "@/features/items/queries";

export interface ProfileSellerStats {
  itemsUploaded: number;
  itemsSold: number;
  totalEarnings: number;
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
