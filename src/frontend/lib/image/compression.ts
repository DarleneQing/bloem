import imageCompression from "browser-image-compression";

export interface CompressionResult {
  fullImage: File;
  thumbnail: File;
}

/**
 * Compress an image to full size and generate thumbnail
 * Full: max 1920px width, max 2MB
 * Thumbnail: max 400px width, max 100KB
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  // Compress full-size image
  const fullImage = await imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
  });

  // Generate thumbnail
  const thumbnail = await imageCompression(file, {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: file.type,
  });

  return {
    fullImage,
    thumbnail,
  };
}

/**
 * Compress multiple images
 */
export async function compressImages(files: File[]): Promise<CompressionResult[]> {
  const compressionPromises = files.map((file) => compressImage(file));
  return Promise.all(compressionPromises);
}

/** Style photos for seller applications — smaller than item listing images. */
export async function compressSellerApplicationPhoto(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.75,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.85,
  });
}

export async function compressSellerApplicationPhotos(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressSellerApplicationPhoto(file)));
}

/**
 * Get compression stats for display
 */
export function getCompressionStats(originalSize: number, compressedSize: number) {
  const savedBytes = originalSize - compressedSize;
  const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(1);

  return {
    originalSize,
    compressedSize,
    savedBytes,
    savedPercentage: parseFloat(savedPercentage),
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

