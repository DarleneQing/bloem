import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";

// ============================================================================
// ADMIN QR BATCH DELETE API
// ============================================================================

/**
 * DELETE /api/admin/qr-batches/[id]
 * Delete a QR batch (Admin only)
 * Note: This will also delete all QR codes in the batch due to CASCADE
 */
export async function DELETE(
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
    
    // Check if batch exists
    const { data: existingBatch, error: checkError } = await supabase
      .from("qr_batches")
      .select("id, prefix, name")
      .eq("id", batchId)
      .single();
    
    if (checkError || !existingBatch) {
      if (checkError?.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "Batch not found"
          },
          { status: 404 }
        );
      }
      
      console.error("Error checking batch existence:", checkError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check batch existence",
          details: checkError?.message
        },
        { status: 500 }
      );
    }
    
    // Check for linked or sold QR codes (optional warning)
    const { data: linkedCodes, error: codesError } = await supabase
      .from("qr_codes")
      .select("id, status")
      .eq("batch_id", batchId)
      .in("status", ["LINKED", "SOLD"]);
    
    if (codesError) {
      console.error("Error checking QR codes:", codesError);
      // Continue with deletion even if check fails
    }
    
    // Delete the batch (QR codes will be deleted due to CASCADE if foreign key is set up)
    // First, delete QR codes to avoid foreign key issues
    const { error: deleteCodesError } = await supabase
      .from("qr_codes")
      .delete()
      .eq("batch_id", batchId);
    
    if (deleteCodesError) {
      console.error("Error deleting QR codes:", deleteCodesError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete QR codes",
          details: deleteCodesError.message
        },
        { status: 500 }
      );
    }
    
    // Then delete the batch
    const { error: deleteError } = await supabase
      .from("qr_batches")
      .delete()
      .eq("id", batchId);
    
    if (deleteError) {
      console.error("Error deleting batch:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete batch",
          details: deleteError.message
        },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Batch deleted successfully",
          deletedBatch: {
            id: batchId,
            prefix: existingBatch.prefix,
            name: existingBatch.name,
            linkedCodesCount: linkedCodes?.length || 0
          }
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin QR batch deletion error:", error);
    
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


