import { NextRequest, NextResponse } from "next/server";

/**
 * Generate Google Maps embed URL server-side
 * This prevents exposing the API key to the browser
 */
export async function GET(request: NextRequest) {
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
  const encodedQuery = encodeURIComponent(query);

  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedQuery}`;

  return NextResponse.json({ url: embedUrl });
}

