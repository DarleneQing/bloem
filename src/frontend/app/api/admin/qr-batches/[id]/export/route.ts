import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";

// ============================================================================
// ADMIN QR BATCH PDF EXPORT API
// ============================================================================

/**
 * GET /api/admin/qr-batches/[id]/export
 * Export QR batch as PDF (Admin only)
 * Returns JSON with QR code data for client-side PDF generation
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    const batchId = params.id;
    
    // Validate UUID format
    const uuidSchema = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidSchema.test(batchId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid batch ID format"
        },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get batch information
    const { data: batch, error: batchError } = await supabase
      .from("qr_batches")
      .select(`
        id,
        name,
        prefix,
        code_count,
        created_at,
        market:markets(
          id,
          name
        )
      `)
      .eq("id", batchId)
      .single();
    
    if (batchError || !batch) {
      if (batchError?.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Batch not found"
          },
          { status: 404 }
        );
      }
      
      console.error("Error fetching batch:", batchError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch batch",
          details: batchError?.message
        },
        { status: 500 }
      );
    }
    
    // Get all QR codes for this batch
    const { data: qrCodes, error: codesError } = await supabase
      .from("qr_codes")
      .select("id, code, status")
      .eq("batch_id", batchId)
      .order("code", { ascending: true });
    
    if (codesError) {
      console.error("Error fetching QR codes:", codesError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch QR codes",
          details: codesError.message
        },
        { status: 500 }
      );
    }
    
    if (!qrCodes || qrCodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No QR codes found for this batch"
        },
        { status: 404 }
      );
    }
    
    // Return codes for client-side QR image generation and PDF creation
    const codes = qrCodes.map(qr => qr.code);
    
    return NextResponse.json(
      {
        success: true,
        data: {
          batch: {
            id: batch.id,
            name: batch.name,
            prefix: batch.prefix,
            createdAt: batch.created_at,
            codeCount: batch.code_count,
            market: batch.market,
          },
          qrCodes: codes,
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin QR batch export error:", error);
    
    // Handle authentication errors
    if (error.message === "Authentication required" || error.message === "Admin status required") {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 401 }
      );
    }
    
    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

