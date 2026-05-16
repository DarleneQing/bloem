import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/maps/embed?address=...&locationName=...
 *
 * Returns a 302 redirect to the Google Maps Embed URL. The API key is never
 * placed in a JSON response body — it only appears in the Location header at
 * the moment an authenticated iframe loads. This is paired with HTTP-referrer
 * restriction on the key in Google Cloud Console for defense in depth.
 *
 * Consumers should set their `<iframe src="/api/maps/embed?address=...">`.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get("address");
  const locationName = searchParams.get("locationName");

  if (!address) {
    return NextResponse.json(
      { error: "Address is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  const query = locationName ? `${locationName}, ${address}` : address;
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}`;

  return NextResponse.redirect(embedUrl, { status: 302 });
}
