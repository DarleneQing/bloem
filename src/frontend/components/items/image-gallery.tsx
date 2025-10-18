"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={images[selectedIndex]}
          alt={`${title} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square relative rounded-md overflow-hidden bg-gray-100 border-2 transition-colors ${
                index === selectedIndex
                  ? "border-primary"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Image src={image} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Image counter */}
      <p className="text-sm text-center text-muted-foreground">
        {selectedIndex + 1} / {images.length}
      </p>
    </div>
  );
}

