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

    // Get the embed URL from server-side API to protect API key
    const params = new URLSearchParams({ address });
    if (locationName) {
      params.append("locationName", locationName);
    }

    fetch(`/api/maps/embed?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          setMapUrl(data.url);
        } else {
          console.warn("Failed to get map URL:", data.error);
          setMapUrl("");
        }
      })
      .catch((error) => {
        console.error("Error fetching map URL:", error);
        setMapUrl("");
      });
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

