import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validations/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Validate userId parameter
    const validatedUserId = uuidSchema.parse(resolvedParams.userId);
    const supabase = await createClient();

    // Get user profile and check if wardrobe is public
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, wardrobe_status, iban_verified_at, created_at")
      .eq("id", validatedUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if wardrobe is public
    if (profile.wardrobe_status !== "PUBLIC") {
      return NextResponse.json(
        { success: false, error: "Wardrobe is private" },
        { status: 403 }
      );
    }

    // Get user's WARDROBE and RACK status items
    const { data: items, error: itemsError } = await supabase
      .from("items")
      .select(`
        id,
        title,
        description,
        brand,
        category,
        size,
        condition,
        color,
        selling_price,
        status,
        image_urls,
        thumbnail_url,
        created_at
      `)
      .eq("owner_id", validatedUserId)
      .in("status", ["WARDROBE", "RACK"])
      .order("created_at", { ascending: false });

    if (itemsError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    // Format response according to API contract (includes both WARDROBE and RACK items)
    const response = {
      success: true,
      user: {
        id: profile.id,
        fullName: `${profile.first_name} ${profile.last_name}`,
        isActiveSeller: !!profile.iban_verified_at,
        wardrobePublic: profile.wardrobe_status === "PUBLIC",
      },
      items: items?.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        brand: item.brand,
        category: item.category,
        size: item.size,
        condition: item.condition,
        color: item.color,
        originalPrice: item.selling_price,
        status: item.status,
        images: item.image_urls.map((url: string, index: number) => ({
          id: `${item.id}-${index}`,
          thumbnailUrl: url,
          displayOrder: index,
        })),
        createdAt: item.created_at,
      })) || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Public wardrobe API error:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
