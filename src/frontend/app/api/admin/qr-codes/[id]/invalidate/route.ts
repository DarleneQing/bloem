import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";
import { qrCodeInvalidationSchema } from "@/lib/validations/schemas";

// ============================================================================
// ADMIN QR CODE INVALIDATION API
// ============================================================================

/**
 * POST /api/admin/qr-codes/[id]/invalidate
 * Invalidate a QR code (Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    const qrCodeId = params.id;
    
    // Validate UUID format
    const uuidSchema = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidSchema.test(qrCodeId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid QR code ID format"
        },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = qrCodeInvalidationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    const { reason } = validation.data;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Check if QR code exists
    const { data: existingCode, error: checkError } = await supabase
      .from("qr_codes")
      .select("id, code, status")
      .eq("id", qrCodeId)
      .single();
    
    if (checkError || !existingCode) {
      if (checkError?.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "QR code not found"
          },
          { status: 404 }
        );
      }
      
      console.error("Error checking QR code existence:", checkError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check QR code existence",
          details: checkError?.message
        },
        { status: 500 }
      );
    }
    
    // Update QR code to invalid status
    const { data: updatedCode, error: updateError } = await supabase
      .from("qr_codes")
      .update({
        status: "INVALID",
        invalidated_at: new Date().toISOString(),
        invalidation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", qrCodeId)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error invalidating QR code:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to invalidate QR code",
          details: updateError.message
        },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          qrCode: {
            id: updatedCode.id,
            code: updatedCode.code,
            status: updatedCode.status,
            invalidated_at: updatedCode.invalidated_at,
            invalidation_reason: updatedCode.invalidation_reason,
            updated_at: updatedCode.updated_at,
          }
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin QR code invalidation error:", error);
    
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

