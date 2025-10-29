'use client';

import { useCallback, useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';

interface ImageCropContextType {
  handleApply: () => void;
  handleReset: () => void;
}

const ImageCropContext = createContext<ImageCropContextType | null>(null);

export const useImageCrop = () => {
  const context = useContext(ImageCropContext);
  if (!context) {
    throw new Error('useImageCrop must be used within ImageCrop');
  }
  return context;
};

interface ImageCropProps extends Omit<ComponentProps<'div'>, 'children' | 'onChange'> {
  file: File;
  aspect: number;
  onCrop: (url: string) => void;
  onComplete?: (url: string) => void;
  onChange?: (data: { width: number; height: number; x: number; y: number }) => void;
  children: ReactNode;
  maxImageSize?: number;
}

export function ImageCrop({
  file,
  aspect,
  onCrop,
  onComplete,
  onChange,
  children,
  maxImageSize,
  ...props
}: ImageCropProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Create object URL from file
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
      onChange?.(croppedAreaPixels);
    },
    [onChange]
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<string | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise<string>((resolve) => {
      let quality = 0.92;
      const getBlob = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(canvas.toDataURL('image/jpeg', q));
            if (maxImageSize && blob.size > maxImageSize && q > 0.1) {
              getBlob(q - 0.1);
            } else {
              resolve(canvas.toDataURL('image/jpeg', q));
            }
          },
          'image/jpeg',
          q
        );
      };
      getBlob(quality);
    });
  };

  const handleApply = useCallback(async () => {
    if (!croppedAreaPixels || !imageUrl) return;

    try {
      const croppedImageUrl = await getCroppedImg(imageUrl, croppedAreaPixels);
      if (croppedImageUrl) {
        onCrop(croppedImageUrl);
        onComplete?.(croppedImageUrl);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [croppedAreaPixels, imageUrl, onCrop, onComplete]);

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  return (
    <ImageCropContext.Provider value={{ handleApply, handleReset }}>
      <div {...props}>
        <div className="relative w-full" style={{ height: '400px' }}>
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              cropShape="rect"
              showGrid={true}
            />
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 justify-end">
          {children}
        </div>
      </div>
    </ImageCropContext.Provider>
  );
}

export function ImageCropContent({ className }: { className?: string }) {
  return <div className={className}></div>;
}

export function ImageCropApply({ ...props }: ComponentProps<typeof Button>) {
  const { handleApply } = useImageCrop();
  return (
    <Button {...props} type="button" onClick={handleApply}>
      Apply Crop
    </Button>
  );
}

export function ImageCropReset({ ...props }: ComponentProps<typeof Button>) {
  const { handleReset } = useImageCrop();
  return (
    <Button {...props} type="button" variant="outline" onClick={handleReset}>
      Reset
    </Button>
  );
}
