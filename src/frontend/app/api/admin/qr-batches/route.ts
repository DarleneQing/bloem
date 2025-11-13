import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminServer } from "@/lib/auth/utils";
import { qrBatchCreationSchema } from "@/lib/validations/schemas";
import { generateBatchCodes } from "@/lib/qr/generation";

// ============================================================================
// ADMIN QR BATCHES API
// ============================================================================

/**
 * POST /api/admin/qr-batches
 * Generate a new QR code batch (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminProfile = await requireAdminServer();
    
    // Parse and validate request body
    const body = await request.json();
    const validation = qrBatchCreationSchema.safeParse(body);
    
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
    
    const { prefix, codeCount, marketId, name } = validation.data;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Verify market exists
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("id, name, status")
      .eq("id", marketId)
      .single();
    
    if (marketError || !market) {
      return NextResponse.json(
        {
          success: false,
          error: "Market not found"
        },
        { status: 404 }
      );
    }
    
    // Check if prefix already exists for this market
    const { data: existingBatch, error: checkError } = await supabase
      .from("qr_batches")
      .select("id, prefix, market_id")
      .eq("prefix", prefix)
      .eq("market_id", marketId)
      .single();
    
    if (existingBatch && !checkError) {
      return NextResponse.json(
        {
          success: false,
          error: `Prefix "${prefix}" already exists for this market`
        },
        { status: 400 }
      );
    }
    
    // Generate batch ID
    const batchId = crypto.randomUUID();
    
    // Generate QR codes
    const codes = generateBatchCodes(prefix, codeCount);
    
    // Start transaction: Create batch and QR codes
    // First, create the batch
    const { data: batch, error: batchError } = await supabase
      .from("qr_batches")
      .insert({
        id: batchId,
        name: name || null,
        prefix,
        market_id: marketId,
        code_count: codeCount,
        created_by: adminProfile.id,
      })
      .select()
      .single();
    
    if (batchError) {
      console.error("Error creating QR batch:", batchError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create QR batch",
          details: batchError.message
        },
        { status: 500 }
      );
    }
    
    // Prepare QR codes for insertion
    const qrCodesToInsert = codes.map((code) => ({
      code,
      prefix,
      batch_id: batchId,
      status: "UNUSED" as const,
    }));
    
    // Insert QR codes in batches (Supabase has limits on batch size)
    const BATCH_SIZE = 100;
    for (let i = 0; i < qrCodesToInsert.length; i += BATCH_SIZE) {
      const batch = qrCodesToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from("qr_codes")
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting QR codes batch ${i / BATCH_SIZE + 1}:`, insertError);
        // Rollback: delete the batch
        await supabase.from("qr_batches").delete().eq("id", batchId);
        
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create QR codes",
            details: insertError.message
          },
          { status: 500 }
        );
      }
    }
    
    // Get batch statistics
    const { data: stats } = await supabase
      .from("qr_codes")
      .select("status")
      .eq("batch_id", batchId);
    
    const statistics = {
      total: stats?.length || 0,
      unused: stats?.filter(s => s.status === "UNUSED").length || 0,
      linked: stats?.filter(s => s.status === "LINKED").length || 0,
      sold: stats?.filter(s => s.status === "SOLD").length || 0,
      invalid: stats?.filter(s => s.status === "INVALID").length || 0,
    };
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          batch: {
            id: batch.id,
            name: batch.name,
            prefix: batch.prefix,
            market_id: batch.market_id,
            code_count: batch.code_count,
            created_by: batch.created_by,
            created_at: batch.created_at,
            updated_at: batch.updated_at,
          },
          statistics,
        }
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error("Admin QR batch creation error:", error);
    
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

/**
 * GET /api/admin/qr-batches
 * List all QR batches with statistics (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdminServer();
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const marketId = searchParams.get("marketId") || "";
    const prefix = searchParams.get("prefix") || "";
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from("qr_batches")
      .select(`
        id,
        name,
        prefix,
        market_id,
        code_count,
        created_by,
        created_at,
        updated_at,
        market:markets(
          id,
          name,
          status
        ),
        creator:profiles!qr_batches_created_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order("created_at", { ascending: false });
    
    // Apply filters
    if (marketId) {
      query = query.eq("market_id", marketId);
    } else {
      // If no market filter, still show all batches (market_id is now required, so all batches have a market)
      // This filter remains for backward compatibility
    }
    
    if (prefix) {
      query = query.ilike("prefix", `%${prefix}%`);
    }
    
    // Get total count for pagination
    const { count } = await supabase
      .from("qr_batches")
      .select("*", { count: "exact", head: true });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data: batches, error: batchesError } = await query;
    
    if (batchesError) {
      console.error("Error fetching QR batches:", batchesError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch QR batches",
          details: batchesError.message
        },
        { status: 500 }
      );
    }
    
    // Get statistics for each batch
    const batchesWithStats = await Promise.all(
      (batches || []).map(async (batch) => {
        const { data: codes } = await supabase
          .from("qr_codes")
          .select("status")
          .eq("batch_id", batch.id);
        
        const total = codes?.length || 0;
        const unused = codes?.filter(c => c.status === "UNUSED").length || 0;
        const linked = codes?.filter(c => c.status === "LINKED").length || 0;
        const sold = codes?.filter(c => c.status === "SOLD").length || 0;
        const invalid = codes?.filter(c => c.status === "INVALID").length || 0;
        
        return {
          ...batch,
          statistics: {
            total,
            unused,
            linked,
            sold,
            invalid,
            unused_percentage: total > 0 ? (unused / total) * 100 : 0,
            linked_percentage: total > 0 ? (linked / total) * 100 : 0,
            sold_percentage: total > 0 ? (sold / total) * 100 : 0,
            invalid_percentage: total > 0 ? (invalid / total) * 100 : 0,
          }
        };
      })
    );
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          batches: batchesWithStats,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          }
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Admin QR batches listing error:", error);
    
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

