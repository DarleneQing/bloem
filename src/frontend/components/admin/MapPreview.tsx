"use client";

interface MapPreviewProps {
  address: string;
  locationName?: string;
  height?: string;
}

export function MapPreview({ address, locationName, height = "300px" }: MapPreviewProps) {
  if (!address) {
    return null;
  }

  const params = new URLSearchParams({ address });
  if (locationName) {
    params.append("locationName", locationName);
  }

  // The iframe src points at our authenticated proxy route; the Google API
  // key only appears in the Location header of the 302 returned by that
  // route (see app/api/maps/embed/route.ts).
  const src = `/api/maps/embed?${params.toString()}`;

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200">
      <iframe
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={src}
        title={`Map preview for ${address}`}
      />
    </div>
  );
}
