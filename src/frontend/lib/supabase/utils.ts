import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth/utils";
import type { Item, ItemStatus } from "@/types/items";

// ============================================================================
// CLIENT-SIDE UTILITIES
// ============================================================================

// Note: Authentication utilities moved to @/lib/auth/utils.ts
// This file now focuses on database operations and data utilities

// ============================================================================
// SERVER-SIDE UTILITIES
// ============================================================================

// Note: Server-side authentication utilities moved to @/lib/auth/utils.ts
// This file now focuses on database operations and data utilities

// ============================================================================
// ITEM UTILITIES
// ============================================================================

/**
 * Get items by owner with optional status filter
 */
export async function getItemsByOwner(
  ownerId: string,
  status?: ItemStatus,
  limit?: number,
  offset?: number
) {
  const supabase = createClient();
  
  let query = supabase
    .from("items")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  
  if (status) {
    query = query.eq("status", status);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  if (offset) {
    query = query.range(offset, offset + (limit || 10) - 1);
  }
  
  const { data: items, error } = await query;
  
  if (error) {
    console.error("Error getting items by owner:", error);
    return [];
  }
  
  return items as Item[];
}

/**
 * Get item by ID with owner verification
 */
export async function getItemById(itemId: string, verifyOwner?: string) {
  const supabase = createClient();
  
  let query = supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .single();
  
  const { data: item, error } = await query;
  
  if (error) {
    console.error("Error getting item by ID:", error);
    return null;
  }
  
  // Verify ownership if requested
  if (verifyOwner && item.owner_id !== verifyOwner) {
    console.error("User is not the owner of this item");
    return null;
  }
  
  return item as Item;
}

/**
 * Get items by status
 */
export async function getItemsByStatus(
  status: ItemStatus,
  limit?: number,
  offset?: number
) {
  const supabase = createClient();
  
  let query = supabase
    .from("items")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  
  if (limit) {
    query = query.limit(limit);
  }
  
  if (offset) {
    query = query.range(offset, offset + (limit || 10) - 1);
  }
  
  const { data: items, error } = await query;
  
  if (error) {
    console.error("Error getting items by status:", error);
    return [];
  }
  
  return items as Item[];
}

/**
 * Search items by title or description
 */
export async function searchItems(
  searchTerm: string,
  category?: string,
  limit?: number
) {
  const supabase = createClient();
  
  let query = supabase
    .from("items")
    .select("*")
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .eq("status", "WARDROBE") // Only search wardrobe items
    .order("created_at", { ascending: false });
  
  if (category) {
    query = query.eq("category", category);
  }
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data: items, error } = await query;
  
  if (error) {
    console.error("Error searching items:", error);
    return [];
  }
  
  return items as Item[];
}

// ============================================================================
// MARKET UTILITIES
// ============================================================================

/**
 * Get active markets
 */
export async function getActiveMarkets() {
  const supabase = createClient();
  
  const { data: markets, error } = await supabase
    .from("markets")
    .select("*")
    .eq("status", "ACTIVE")
    .gte("end_date", new Date().toISOString())
    .order("start_date", { ascending: true });
  
  if (error) {
    console.error("Error getting active markets:", error);
    return [];
  }
  
  return markets;
}

/**
 * Get market by ID
 */
export async function getMarketById(marketId: string) {
  const supabase = createClient();
  
  const { data: market, error } = await supabase
    .from("markets")
    .select("*")
    .eq("id", marketId)
    .single();
  
  if (error) {
    console.error("Error getting market by ID:", error);
    return null;
  }
  
  return market;
}

// ============================================================================
// QR CODE UTILITIES
// ============================================================================

/**
 * Get QR codes by batch ID
 */
export async function getQRCodesByBatch(batchId: string) {
  const supabase = createClient();
  
  const { data: qrCodes, error } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("Error getting QR codes by batch:", error);
    return [];
  }
  
  return qrCodes;
}

/**
 * Get QR code by code string
 */
export async function getQRCodeByCode(code: string) {
  const supabase = createClient();
  
  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select(`
      *,
      items (
        id,
        title,
        description,
        selling_price,
        image_urls,
        thumbnail_url,
        profiles!items_owner_id_fkey (
          first_name,
          last_name
        )
      )
    `)
    .eq("code", code)
    .single();
  
  if (error) {
    console.error("Error getting QR code by code:", error);
    return null;
  }
  
  return qrCode;
}

// ============================================================================
// TRANSACTION UTILITIES
// ============================================================================

/**
 * Get user's transactions
 */
export async function getUserTransactions(userId?: string) {
  const supabase = createClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return [];
    userId = user.id;
  }
  
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(`
      *,
      items (
        id,
        title,
        image_urls,
        thumbnail_url
      ),
      profiles!transactions_seller_id_fkey (
        first_name,
        last_name
      )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error getting user transactions:", error);
    return [];
  }
  
  return transactions;
}

// ============================================================================
// CART UTILITIES
// ============================================================================

/**
 * Get user's cart
 */
export async function getUserCart(userId?: string) {
  const supabase = createClient();
  
  // If no userId provided, get current user
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return null;
    userId = user.id;
  }
  
  const { data: cart, error } = await supabase
    .from("carts")
    .select(`
      *,
      cart_items (
        *,
        items (
          id,
          title,
          description,
          selling_price,
          image_urls,
          thumbnail_url,
          profiles!items_owner_id_fkey (
            first_name,
            last_name
          )
        )
      )
    `)
    .eq("user_id", userId)
    .single();
  
  if (error) {
    console.error("Error getting user cart:", error);
    return null;
  }
  
  return cart;
}

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Handle Supabase errors with proper logging
 */
export function handleSupabaseError(error: any, operation: string) {
  console.error(`Supabase error in ${operation}:`, error);
  
  // Return user-friendly error messages
  if (error.code === "PGRST116") {
    return "No data found";
  }
  
  if (error.code === "23505") {
    return "This item already exists";
  }
  
  if (error.code === "23503") {
    return "Referenced data not found";
  }
  
  if (error.code === "42501") {
    return "You don't have permission to perform this action";
  }
  
  return error.message || "An unexpected error occurred";
}

/**
 * Validate user permissions for operations
 */
export async function validateUserPermission(
  userId: string,
  resourceOwnerId: string,
  isAdmin: boolean = false
): Promise<boolean> {
  // Admin can access everything
  if (isAdmin) return true;
  
  // User can only access their own resources
  return userId === resourceOwnerId;
}

// ============================================================================
// PAGINATION UTILITIES
// ============================================================================

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  
  return {
    total,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? page + 1 : null,
    previousPage: hasPreviousPage ? page - 1 : null,
  };
}

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Transform database row to API response format
 */
export function transformItemForAPI(item: any) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    brand: item.brand,
    category: item.category,
    size: item.size,
    condition: item.condition,
    color: item.color,
    sellingPrice: item.selling_price,
    status: item.status,
    images: item.image_urls.map((url: string, index: number) => ({
      id: `${item.id}-${index}`,
      imageUrl: url,
      thumbnailUrl: index === 0 ? item.thumbnail_url : url,
      displayOrder: index,
    })),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

/**
 * Transform profile for API response
 */
export function transformProfileForAPI(profile: any) {
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    phone: profile.phone,
    address: profile.address,
    role: profile.role,
    isActiveSeller: !!profile.iban_verified_at,
    ibanVerifiedAt: profile.iban_verified_at,
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

// ============================================================================
// CACHE UTILITIES
// ============================================================================

/**
 * Generate cache key for user-specific data
 */
export function generateUserCacheKey(userId: string, dataType: string): string {
  return `user:${userId}:${dataType}`;
}

/**
 * Generate cache key for public data
 */
export function generatePublicCacheKey(dataType: string, params?: Record<string, any>): string {
  const paramString = params ? `:${JSON.stringify(params)}` : "";
  return `public:${dataType}${paramString}`;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate IBAN format (basic validation)
 */
export function isValidIBAN(iban: string): boolean {
  // Remove spaces and convert to uppercase
  const cleanIban = iban.replace(/\s/g, "").toUpperCase();
  
  // Basic IBAN format validation (2 letters + 2 digits + up to 30 alphanumeric)
  const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
  return ibanRegex.test(cleanIban);
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  return new Date(date) > new Date();
}
