"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
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

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    URL.revokeObjectURL(images[index].preview);
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

  return (
    <div className="space-y-2">
        {fileInput}

        <div className="-mx-1 flex h-[20vh] min-h-[132px] max-h-[220px] gap-2.5 overflow-x-auto px-1 py-1">
          {images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "relative h-full aspect-[3/4] shrink-0 overflow-hidden rounded-xl bg-muted",
                index === 0 && "border-2 border-brand-purple"
              )}
            >
              <button
                type="button"
                onClick={() => handleCrop(index)}
                className="absolute inset-0"
                aria-label={`Edit photo ${index + 1}`}
              >
                <Image src={image.preview} alt={`Photo ${index + 1}`} fill className="object-cover" />
              </button>
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm transition-colors hover:bg-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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

