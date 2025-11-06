"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from '@/components/ui/shadcn-io/image-crop';

interface ImageCropModalProps {
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  onClose: () => void;
  aspectRatio?: number;
}

export function ImageCropModal({
  imageSrc,
  onCropComplete,
  onClose,
  aspectRatio = 4 / 5, // 4:5 aspect ratio by default
}: ImageCropModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const f = new File([blob], "image.jpg", { type: blob.type });
        setFile(f);
      });
  }, [imageSrc]);

  const handleCrop = useCallback((url: string) => {
    setCroppedImageUrl(url);
  }, []);

  const handleComplete = useCallback(async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
    onCropComplete(file);
    onClose();
  }, [onCropComplete, onClose]);

  if (!file) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <p>Loading image...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (croppedImageUrl) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Complete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-[4/5] relative w-full max-w-sm mx-auto bg-gray-100 rounded-lg overflow-hidden">
              <img src={croppedImageUrl} alt="Cropped" className="w-full h-full object-contain" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={onClose} variant="outline">
                <XIcon className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ImageCrop
            aspect={aspectRatio}
            file={file}
            maxImageSize={5 * 1024 * 1024} // 5MB
            onChange={(data) => console.log("Crop changed:", data)}
            onComplete={handleComplete}
            onCrop={handleCrop}
          >
            <ImageCropContent className="max-w-2xl mx-auto" />
            <div className="flex items-center gap-2 justify-end">
              <ImageCropApply />
              <ImageCropReset />
            </div>
          </ImageCrop>
        </div>
      </DialogContent>
    </Dialog>
  );
}

