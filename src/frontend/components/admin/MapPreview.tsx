"use client";

import { useEffect, useState } from "react";

interface MapPreviewProps {
  address: string;
  locationName?: string;
  height?: string;
}

export function MapPreview({ address, locationName, height = "300px" }: MapPreviewProps) {
  const [mapUrl, setMapUrl] = useState<string>("");

  useEffect(() => {
    if (!address) {
      setMapUrl("");
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn("Google Maps API key not found");
      setMapUrl("");
      return;
    }

    const query = locationName ? `${locationName}, ${address}` : address;
    const encodedQuery = encodeURIComponent(query);
    
    const url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedQuery}`;
    setMapUrl(url);
  }, [address, locationName]);

  if (!mapUrl) {
    return null;
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200">
      <iframe
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={mapUrl}
        title={`Map preview for ${address}`}
      />
    </div>
  );
}

