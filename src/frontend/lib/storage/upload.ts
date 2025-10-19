import { createClient } from "@/lib/supabase/client";

export interface UploadResult {
  fullImageUrl: string;
  thumbnailUrl: string;
}

/**
 * Upload full image and thumbnail to Supabase Storage
 */
export async function uploadItemImages(
  userId: string,
  fullImage: File,
  thumbnail: File
): Promise<UploadResult> {
  const supabase = createClient();

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const fileExtension = fullImage.name.split(".").pop() || "jpg";
  const fileName = `${timestamp}_${randomString}.${fileExtension}`;

  // Upload full image
  const fullImagePath = `${userId}/${fileName}`;
  const { error: fullImageError } = await supabase.storage
    .from("items-images-full")
    .upload(fullImagePath, fullImage, {
      cacheControl: "3600",
      upsert: false,
    });

  if (fullImageError) {
    throw new Error(`Failed to upload full image: ${fullImageError.message}`);
  }

  // Upload thumbnail
  const thumbnailPath = `${userId}/${fileName}`;
  const { error: thumbnailError } = await supabase.storage
    .from("items-images-thumbnails")
    .upload(thumbnailPath, thumbnail, {
      cacheControl: "3600",
      upsert: false,
    });

  if (thumbnailError) {
    // Clean up full image if thumbnail upload fails
    await supabase.storage.from("items-images-full").remove([fullImagePath]);
    throw new Error(`Failed to upload thumbnail: ${thumbnailError.message}`);
  }

  // Get public URLs
  const { data: fullImageData } = supabase.storage
    .from("items-images-full")
    .getPublicUrl(fullImagePath);

  const { data: thumbnailData } = supabase.storage
    .from("items-images-thumbnails")
    .getPublicUrl(thumbnailPath);

  return {
    fullImageUrl: fullImageData.publicUrl,
    thumbnailUrl: thumbnailData.publicUrl,
  };
}

/**
 * Upload multiple images
 */
export async function uploadMultipleItemImages(
  userId: string,
  images: { fullImage: File; thumbnail: File }[]
): Promise<UploadResult[]> {
  const uploadPromises = images.map((image) =>
    uploadItemImages(userId, image.fullImage, image.thumbnail)
  );

  return Promise.all(uploadPromises);
}

/**
 * Delete item images from storage
 */
export async function deleteItemImages(imageUrls: string[]): Promise<void> {
  const supabase = createClient();

  // Extract paths from URLs
  const fullImagePaths = imageUrls.map((url) => {
    const urlParts = url.split("/items-images-full/");
    return urlParts[1] || "";
  }).filter(Boolean);

  const thumbnailPaths = imageUrls.map((url) => {
    const urlParts = url.split("/items-images-thumbnails/");
    return urlParts[1] || "";
  }).filter(Boolean);

  // Delete from full images bucket
  if (fullImagePaths.length > 0) {
    await supabase.storage.from("items-images-full").remove(fullImagePaths);
  }

  // Delete from thumbnails bucket
  if (thumbnailPaths.length > 0) {
    await supabase.storage.from("items-images-thumbnails").remove(thumbnailPaths);
  }
}

