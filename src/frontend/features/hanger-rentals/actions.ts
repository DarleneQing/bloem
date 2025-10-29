"use server";

import { createClient } from "@/lib/supabase/server";
import { createHangerRentalSchema, updateHangerRentalSchema, hangerRentalIdSchema } from "./validations";
import { CreateHangerRentalInput, UpdateHangerRentalInput } from "@/types/rentals";

export async function createHangerRental(input: CreateHangerRentalInput) {
  const { marketId, hangerCount } = createHangerRentalSchema.parse(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" } as const;

  const { data, error } = await supabase
    .from("market_enrollments").select("id").eq("market_id", marketId).eq("seller_id", user.id).maybeSingle();
  if (!data) return { error: "Not enrolled in this market" } as const;

  // Call RPC directly to avoid URL parsing issues in server actions
  const { data: created, error: rpcError } = await supabase
    .rpc("rpc_create_hanger_rental", { p_seller: user.id, p_market: marketId, p_count: hangerCount })
    .single();

  if (rpcError) {
    const errorMsg = (rpcError as any).message || (rpcError as any).details || rpcError?.code || "Failed to create hanger rental";
    console.error("RPC Error:", rpcError);
    return { error: errorMsg } as const;
  }
  return { success: true, data: created } as const;
}

export async function updateHangerRental(input: UpdateHangerRentalInput) {
  const { id, hangerCount } = updateHangerRentalSchema.parse(input);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" } as const;

  const { data: updated, error: rpcError } = await supabase
    .rpc("rpc_update_hanger_rental_quantity", { p_seller: user.id, p_rental: id, p_new_count: hangerCount })
    .single();
  if (rpcError) return { error: (rpcError as any).message || "Failed" } as const;
  return { success: true, data: updated } as const;
}

export async function cancelHangerRental(id: string) {
  const { id: rentalId } = hangerRentalIdSchema.parse({ id });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" } as const;

  const { error: rpcError } = await supabase
    .rpc("rpc_cancel_hanger_rental", { p_seller: user.id, p_rental: rentalId });
  if (rpcError) return { error: (rpcError as any).message || "Failed" } as const;
  return { success: true } as const;
}


