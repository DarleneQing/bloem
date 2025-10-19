"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/image/compression";

interface ImageFile {
  file: File;
  preview: string;
}

interface ImageUploaderProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  error?: string;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  error,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).slice(0, maxImages - images.length);

    const imageFiles: ImageFile[] = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    onImagesChange([...images, ...imageFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    URL.revokeObjectURL(images[index].preview);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            <div>
              <p className="font-medium mb-1">Drop images here or click to upload</p>
              <p className="text-sm text-muted-foreground">
                {images.length} / {maxImages} images • Max 5MB each • JPEG, PNG, WebP
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Files
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                <Image
                  src={image.preview}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* First image badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                    Cover
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => moveImage(index, index - 1)}
                    >
                      ←
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                  >
                    Remove
                  </Button>
                  {index < images.length - 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => moveImage(index, index + 1)}
                    >
                      →
                    </Button>
                  )}
                </div>
              </div>

              {/* File size */}
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {formatBytes(image.file.size)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

