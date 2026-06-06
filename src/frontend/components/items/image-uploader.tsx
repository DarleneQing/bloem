"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/image/compression";
import { ImageCropModal } from "./image-crop-modal";
import imageCompression from "browser-image-compression";

interface ImageFile {
  file: File;
  preview: string;
}

interface ImageUploaderProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  error?: string;
  variant?: "default" | "strip";
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  error,
  variant = "default",
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  const [compressingFiles, setCompressingFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear validation error when parent error prop changes or images are updated
  useEffect(() => {
    if (!error) {
      setValidationError("");
    }
  }, [error, images.length]);

  // Cleanup: Revoke all Object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all preview URLs to prevent memory leaks
      images.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []); // Empty dependency array - only run on unmount

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    setValidationError("");

    // Check if adding files would exceed maxImages
    const remainingSlots = maxImages - images.length;
    const selectedFiles = Array.from(files);
    
    if (selectedFiles.length > remainingSlots) {
      setValidationError(`Too many images selected. You can add ${remainingSlots} more image(s). (Maximum ${maxImages} images allowed)`);
      // Clear the file input to allow re-selecting
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Process each file
    const processedFiles: ImageFile[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    
    for (const file of selectedFiles) {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        setValidationError(`Image ${file.name} has invalid type. Only JPEG, PNG, and WebP are allowed.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Check if file needs compression (> 5MB)
      if (file.size > maxSize) {
        setCompressingFiles((prev) => new Set(prev).add(file.name));
        
        try {
          // Compress to 5MB max size
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 5,
            maxWidthOrHeight: 4096,
            useWebWorker: true,
            fileType: file.type,
          });
          
          processedFiles.push({
            file: compressedFile,
            preview: URL.createObjectURL(compressedFile),
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Failed to compress image";
          setValidationError(`${errorMsg}: ${file.name}`);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        } finally {
          setCompressingFiles((prev) => {
            const next = new Set(prev);
            next.delete(file.name);
            return next;
          });
        }
      } else {
        // File is small enough, add directly
        processedFiles.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    }

    onImagesChange([...images, ...processedFiles]);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFileSelect(e.dataTransfer.files);
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

  const handleCrop = (index: number) => {
    setCropImageIndex(index);
  };

  const handleCropComplete = (croppedFile: File) => {
    if (cropImageIndex === null) return;

    const newImages = [...images];
    
    // Revoke old preview URL
    URL.revokeObjectURL(newImages[cropImageIndex].preview);
    
    // Update with cropped file
    newImages[cropImageIndex] = {
      file: croppedFile,
      preview: URL.createObjectURL(croppedFile),
    };
    
    onImagesChange(newImages);
    setCropImageIndex(null);
  };

  const handleCropClose = () => {
    setCropImageIndex(null);
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      className="hidden"
      onChange={(e) => {
        handleFileSelect(e.target.files);
      }}
    />
  );

  const cropAspectRatio = variant === "strip" ? 3 / 4 : 4 / 5;

  const cropModal =
    cropImageIndex !== null ? (
      <ImageCropModal
        imageSrc={images[cropImageIndex].preview}
        onCropComplete={handleCropComplete}
        onClose={handleCropClose}
        aspectRatio={cropAspectRatio}
      />
    ) : null;

  if (variant === "strip") {
    return (
      <div className="space-y-2">
        {fileInput}

        <div className="-mx-1 flex h-[20vh] min-h-[132px] max-h-[220px] gap-2.5 overflow-x-auto px-1 pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleCrop(index)}
              className={cn(
                "relative h-full aspect-[3/4] shrink-0 overflow-hidden rounded-xl bg-muted",
                index === 0 && "ring-2 ring-brand-purple ring-offset-2 ring-offset-background"
              )}
            >
              <Image src={image.preview} alt={`Photo ${index + 1}`} fill className="object-cover" />
            </button>
          ))}

          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-full aspect-[3/4] shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed border-brand-purple/60 bg-brand-purple/5 text-brand-purple transition-colors hover:border-brand-purple hover:bg-brand-purple/10"
            >
              <Plus className="h-6 w-6" />
              <span className="text-xs font-medium">Add</span>
            </button>
          )}
        </div>

        {(error || validationError) && (
          <p className="text-xs text-destructive">{error || validationError}</p>
        )}

        {compressingFiles.size > 0 && (
          <p className="text-xs text-primary">Compressing images…</p>
        )}

        {cropModal}
      </div>
    );
  }

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
          {fileInput}

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
                {images.length} / {maxImages} images • Images larger than 5MB will be compressed • JPEG, PNG, WebP
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

      {(error || validationError) && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error || validationError}
        </div>
      )}

      {/* Compression Progress */}
      {compressingFiles.size > 0 && (
        <div className="rounded-md bg-primary/15 p-3 text-sm text-primary">
          Compressing large images ({Array.from(compressingFiles).join(", ")})... Please wait.
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-[4/5] relative rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
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

                {/* Always-visible delete (touch-friendly; hover overlay below is desktop-only) */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label="Delete image"
                  className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm transition-colors hover:bg-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Action buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCrop(index)}
                    className="w-auto"
                  >
                    ✏️ Crop
                  </Button>
                  
                  <div className="flex items-center gap-2">
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
              </div>

              {/* File size */}
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {formatBytes(image.file.size)}
              </p>
            </div>
          ))}
        </div>
      )}

      {cropModal}
    </div>
  );
}

