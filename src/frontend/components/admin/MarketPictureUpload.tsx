"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface MarketPictureUploadProps {
  value: string | undefined;
  onChange: (url: string) => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  error?: string;
}

export function MarketPictureUpload({
  value,
  onChange,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  disabled = false,
  error,
}: MarketPictureUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      onUploadError?.("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onUploadError?.("File size exceeds 5MB limit.");
      return;
    }

    setIsUploading(true);
    onUploadStart?.();
    setUploadProgress("Uploading...");

    try {
      // Import upload function dynamically
      const { uploadMarketPicture } = await import("@/lib/storage/upload");
      const imageUrl = await uploadMarketPicture(file);
      
      onChange(imageUrl);
      onUploadComplete?.();
      setUploadProgress("Upload complete!");
      
      setTimeout(() => setUploadProgress(""), 2000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Upload failed";
      onUploadError?.(errorMsg);
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && !isUploading) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange("/assets/images/brand-transparent.png");
  };

  return (
    <div className="space-y-3">
      {/* Current Image Display - Show for any value including default */}
      {value && (
        <div className="space-y-2">
          <div className="relative inline-block group w-full">
            <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <Image
                src={value}
                alt="Market picture"
                fill
                className="object-contain"
                onError={() => {
                  onChange("/assets/images/brand-transparent.png");
                }}
              />
              {!disabled && value !== "/assets/images/brand-transparent.png" && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
              {!disabled && value === "/assets/images/brand-transparent.png" && (
                <div className="absolute bottom-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded">
                  Default Image
                </div>
              )}
            </div>
          </div>
          {!disabled && (
            <p className="text-sm text-muted-foreground text-center">
              {value === "/assets/images/brand-transparent.png" 
                ? "Upload an image to customize this market" 
                : "Click 'Change Picture' below to replace this picture"}
            </p>
          )}
        </div>
      )}

      {/* Upload Area - Always visible when not disabled */}
      {!disabled && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={disabled || isUploading}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              ) : (
                <ImageIcon className="h-6 w-6 text-primary" />
              )}
            </div>

            <div className="text-center">
              <p className="font-medium mb-1">
                {isUploading ? "Uploading..." : value && value !== "/assets/images/brand-transparent.png" ? "Upload a new picture" : "Drop image here or click to upload"}
              </p>
              <p className="text-sm text-muted-foreground">
                Max 5MB • JPEG, PNG, WebP
              </p>
              {uploadProgress && (
                <p className="text-sm text-primary mt-1">{uploadProgress}</p>
              )}
            </div>

            <Button
              type="button"
              variant={value && value !== "/assets/images/brand-transparent.png" ? "default" : "outline"}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {value && value !== "/assets/images/brand-transparent.png" ? "Change Picture" : "Choose Image"}
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}

