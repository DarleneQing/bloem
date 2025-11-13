"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";
import { qrBatchCreationSchema, qrCodeInvalidationSchema } from "./validations";
import { generateBatchCodes } from "@/lib/qr/generation";

/**
 * Create a new QR code batch
 */
export async function createQRBatch(input: {
  prefix: string;
  codeCount: number;
  marketId: string;
  name?: string | null;
}) {
  try {
    const validated = qrBatchCreationSchema.parse(input);
    const adminProfile = await requireAdminServer();
    const supabase = await createClient();

    // Verify market exists
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("id, name, status")
      .eq("id", validated.marketId)
      .single();

    if (marketError || !market) {
      return { error: "Market not found" } as const;
    }

    // Check if prefix already exists for this market
    const { data: existingBatch } = await supabase
      .from("qr_batches")
      .select("id")
      .eq("prefix", validated.prefix)
      .eq("market_id", validated.marketId)
      .single();

    if (existingBatch) {
      return { error: `Prefix "${validated.prefix}" already exists for this market` } as const;
    }

    // Generate batch ID and codes
    const batchId = crypto.randomUUID();
    const codes = generateBatchCodes(validated.prefix, validated.codeCount);

    // Create batch
    const { data: batch, error: batchError } = await supabase
      .from("qr_batches")
      .insert({
        id: batchId,
        name: validated.name || null,
        prefix: validated.prefix,
        market_id: validated.marketId,
        code_count: validated.codeCount,
        created_by: adminProfile.id,
      })
      .select()
      .single();

    if (batchError || !batch) {
      return { error: batchError?.message || "Failed to create QR batch" } as const;
    }

    // Insert QR codes in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < codes.length; i += BATCH_SIZE) {
      const batch = codes.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("qr_codes")
        .insert(batch.map(code => ({
          code,
          prefix: validated.prefix,
          batch_id: batchId,
          status: "UNUSED",
        })));

      if (insertError) {
        // Rollback: delete the batch
        await supabase.from("qr_batches").delete().eq("id", batchId);
        return { error: insertError.message || "Failed to create QR codes" } as const;
      }
    }

    revalidatePath("/admin/qr-codes");
    return { data: { batch } } as const;
  } catch (error: any) {
    if (error.message === "Authentication required" || error.message === "Admin status required") {
      return { error: error.message } as const;
    }
    return { error: error.message || "Failed to create QR batch" } as const;
  }
}

/**
 * Invalidate a QR code
 */
export async function invalidateQRCode(qrCodeId: string, reason: string) {
  try {
    const validated = qrCodeInvalidationSchema.parse({ reason });
    await requireAdminServer();
    const supabase = await createClient();

    const { data: updatedCode, error: updateError } = await supabase
      .from("qr_codes")
      .update({
        status: "INVALID",
        invalidated_at: new Date().toISOString(),
        invalidation_reason: validated.reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", qrCodeId)
      .select()
      .single();

    if (updateError || !updatedCode) {
      return { error: updateError?.message || "Failed to invalidate QR code" } as const;
    }

    revalidatePath("/admin/qr-codes");
    return { data: { qrCode: updatedCode } } as const;
  } catch (error: any) {
    if (error.message === "Authentication required" || error.message === "Admin status required") {
      return { error: error.message } as const;
    }
    return { error: error.message || "Failed to invalidate QR code" } as const;
  }
}

/**
 * Export QR batch as PDF (returns data for client-side PDF generation)
 */
export async function exportQRBatchPDF(batchId: string) {
  try {
    await requireAdminServer();
    const supabase = await createClient();

    // Get batch and codes
    const { data: batch } = await supabase
      .from("qr_batches")
      .select(`
        id,
        name,
        prefix,
        code_count,
        created_at,
        market:markets(id, name)
      `)
      .eq("id", batchId)
      .single();

    if (!batch) {
      return { error: "Batch not found" } as const;
    }

    const { data: qrCodes } = await supabase
      .from("qr_codes")
      .select("id, code, status")
      .eq("batch_id", batchId)
      .order("code", { ascending: true });

    if (!qrCodes || qrCodes.length === 0) {
      return { error: "No QR codes found for this batch" } as const;
    }

    // Return data for client-side PDF generation
    return {
      data: {
        batch: {
          id: batch.id,
          name: batch.name,
          prefix: batch.prefix,
          createdAt: batch.created_at,
          codeCount: batch.code_count,
          market: batch.market,
        },
        qrCodes: qrCodes.map(qr => qr.code),
      }
    } as const;
  } catch (error: any) {
    if (error.message === "Authentication required" || error.message === "Admin status required") {
      return { error: error.message } as const;
    }
    return { error: error.message || "Failed to export QR batch" } as const;
  }
}

/**
 * Delete a QR batch
 */
export async function deleteQRBatch(batchId: string) {
  try {
    await requireAdminServer();
    const supabase = await createClient();

    // Check if batch exists
    const { data: batch } = await supabase
      .from("qr_batches")
      .select("id")
      .eq("id", batchId)
      .single();

    if (!batch) {
      return { error: "Batch not found" } as const;
    }

    // Delete QR codes first
    const { error: deleteCodesError } = await supabase
      .from("qr_codes")
      .delete()
      .eq("batch_id", batchId);

    if (deleteCodesError) {
      return { error: deleteCodesError.message || "Failed to delete QR codes" } as const;
    }

    // Delete the batch
    const { error: deleteError } = await supabase
      .from("qr_batches")
      .delete()
      .eq("id", batchId);

    if (deleteError) {
      return { error: deleteError.message || "Failed to delete batch" } as const;
    }

    revalidatePath("/admin/qr-codes");
    return { data: { success: true } } as const;
  } catch (error: any) {
    if (error.message === "Authentication required" || error.message === "Admin status required") {
      return { error: error.message } as const;
    }
    return { error: error.message || "Failed to delete batch" } as const;
  }
}

