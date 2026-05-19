import { NextRequest, NextResponse } from "next/server";
import { requireAdminServer } from "@/lib/auth/utils";

/**
 * PATCH /api/admin/users/[id]/seller-status
 * Legacy IBAN verification toggle — disabled; active seller status requires Stripe Connect.
 */
export async function PATCH(_request: NextRequest) {
  try {
    await requireAdminServer();

    return NextResponse.json(
      {
        success: false,
        error:
          "Seller activation is managed through Stripe Connect only. Legacy IBAN data is retained for reference but does not activate sellers.",
      },
      { status: 410 }
    );
  } catch (error) {
    console.error("Update seller status API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
