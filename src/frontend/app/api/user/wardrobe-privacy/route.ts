import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { wardrobePrivacyToggleSchema } from "@/lib/validations/schemas";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = wardrobePrivacyToggleSchema.parse(body);
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Update wardrobe privacy status
    const wardrobeStatus = validated.public ? "PUBLIC" : "PRIVATE";
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ wardrobe_status: wardrobeStatus })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      wardrobePublic: validated.public,
    });
  } catch (error) {
    console.error("Wardrobe privacy toggle error:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
