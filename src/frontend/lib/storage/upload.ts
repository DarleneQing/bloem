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

/**
 * Upload a single market picture to Supabase Storage
 */
export async function uploadMarketPicture(
  image: File
): Promise<string> {
  const supabase = createClient();

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const fileExtension = image.name.split(".").pop() || "jpg";
  const fileName = `${timestamp}_${randomString}.${fileExtension}`;

  // Upload to market-images bucket
  const { error: uploadError } = await supabase.storage
    .from("market-images")
    .upload(fileName, image, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload market image: ${uploadError.message}`);
  }

  // Get public URL
  const { data } = supabase.storage
    .from("market-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * Delete market picture from storage
 */
const SELLER_APPLICATION_UPLOAD_ATTEMPTS = 3;
const SELLER_APPLICATION_UPLOAD_RETRY_MS = 800;

function isRetryableStorageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ssl|network|fetch|failed to fetch|bad_record|econnreset|timeout|aborted/i.test(
    message
  );
}

function storageUploadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Upload failed due to a network error. Check your connection and try again.";
}

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a seller application style photo (stored per user + market).
 */
export async function uploadSellerApplicationPhoto(
  userId: string,
  marketId: string,
  image: File
): Promise<string> {
  const supabase = createClient();

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const fileExtension = image.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${userId}/${marketId}/${timestamp}_${randomString}.jpg`;
  const contentType = image.type.startsWith("image/") ? image.type : "image/jpeg";

  let lastError: unknown;

  for (let attempt = 1; attempt <= SELLER_APPLICATION_UPLOAD_ATTEMPTS; attempt++) {
    try {
      const { error: uploadError } = await supabase.storage
        .from("seller-application-photos")
        .upload(fileName, image, {
          cacheControl: "3600",
          upsert: false,
          contentType,
        });

      if (uploadError) {
        throw new Error(`Failed to upload application photo: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from("seller-application-photos").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      lastError = error;
      const canRetry = attempt < SELLER_APPLICATION_UPLOAD_ATTEMPTS && isRetryableStorageError(error);
      if (!canRetry) {
        break;
      }
      await pause(SELLER_APPLICATION_UPLOAD_RETRY_MS * attempt);
    }
  }

  throw new Error(storageUploadErrorMessage(lastError));
}

export async function deleteMarketPicture(imageUrl: string): Promise<void> {
  const supabase = createClient();

  // Extract path from URL
  const urlParts = imageUrl.split("/market-images/");
  const fileName = urlParts[1];

  if (fileName) {
    await supabase.storage.from("market-images").remove([fileName]);
  }
}

