"use server";

import { createClient } from "@/lib/supabase/server";
import type { QRCodeWithItem, QRCodeScanResult } from "@/types/qr-codes";
import { validateQRCodeFormat } from "@/lib/qr/generation";

/**
 * Get QR code by code string (for scanning)
 * Note: This is a server-side query. For client-side, use the API endpoint.
 */
export async function getQRCodeByCode(code: string): Promise<QRCodeScanResult | null> {
  const supabase = await createClient();

  // Validate QR code format
  if (!validateQRCodeFormat(code)) {
    return null;
  }

  // Get QR code with batch and market info
  const { data: qrCode, error: qrError } = await supabase
    .from("qr_codes")
    .select(`
      *,
      qr_batches!inner(
        id,
        market_id,
        market:markets(
          id,
          name,
          status
        )
      )
    `)
    .eq("code", code)
    .single();

  if (qrError || !qrCode) {
    return null;
  }

  const batch = qrCode.qr_batches as any;
  const market = batch?.market || null;

  // If QR code is linked to an item, get item details
  let item = null;
  if (qrCode.item_id && qrCode.status === "LINKED") {
    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select(`
        id,
        title,
        description,
        selling_price,
        image_urls,
        thumbnail_url,
        owner:profiles!items_owner_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq("id", qrCode.item_id)
      .single();

    if (!itemError && itemData) {
      const owner = Array.isArray(itemData.owner) ? itemData.owner[0] : itemData.owner;
      if (owner) {
        item = {
          id: itemData.id,
          title: itemData.title,
          description: itemData.description,
          selling_price: itemData.selling_price,
          image_urls: itemData.image_urls,
          thumbnail_url: itemData.thumbnail_url,
          owner: {
            id: owner.id,
            first_name: owner.first_name,
            last_name: owner.last_name,
          },
        };
      }
    }
  }

  // Determine if QR code can be linked
  let canLink = false;
  let reason: string | undefined;

  if (qrCode.status !== "UNUSED") {
    canLink = false;
    reason = `QR code is already ${qrCode.status.toLowerCase()}`;
  } else if (qrCode.invalidated_at) {
    canLink = false;
    reason = "QR code has been invalidated";
  } else {
    canLink = true;
  }

  return {
    qrCode: {
      id: qrCode.id,
      code: qrCode.code,
      status: qrCode.status,
      item_id: qrCode.item_id,
      linked_at: qrCode.linked_at,
      batch_id: qrCode.batch_id,
      prefix: qrCode.prefix,
      invalidated_at: qrCode.invalidated_at,
      invalidation_reason: qrCode.invalidation_reason,
      created_at: qrCode.created_at,
      updated_at: qrCode.updated_at,
    },
    market: market ? {
      id: market.id,
      name: market.name,
      status: market.status,
    } : null,
    item,
    canLink,
    reason,
  };
}

/**
 * Get QR code by ID with item details
 */
export async function getQRCodeById(qrCodeId: string): Promise<QRCodeWithItem | null> {
  const supabase = await createClient();

  const { data: qrCode, error } = await supabase
    .from("qr_codes")
    .select(`
      *,
      items(
        id,
        title,
        description,
        selling_price,
        image_urls,
        thumbnail_url,
        profiles!items_owner_id_fkey(
          first_name,
          last_name
        )
      )
    `)
    .eq("id", qrCodeId)
    .single();

  if (error || !qrCode) {
    return null;
  }

  const item = qrCode.items as any;

  return {
    id: qrCode.id,
    code: qrCode.code,
    status: qrCode.status,
    item_id: qrCode.item_id,
    linked_at: qrCode.linked_at,
    batch_id: qrCode.batch_id,
    prefix: qrCode.prefix,
    invalidated_at: qrCode.invalidated_at,
    invalidation_reason: qrCode.invalidation_reason,
    created_at: qrCode.created_at,
    updated_at: qrCode.updated_at,
    item: item ? {
      id: item.id,
      title: item.title,
      description: item.description,
      selling_price: item.selling_price,
      image_urls: item.image_urls,
      thumbnail_url: item.thumbnail_url,
      owner: item.profiles ? {
        first_name: item.profiles.first_name,
        last_name: item.profiles.last_name,
      } : {
        first_name: "",
        last_name: "",
      },
    } : null,
  };
}

/**
 * Get user's WARDROBE items for QR code linking
 * Only returns items that belong to the user and are in WARDROBE status
 */
export async function getWardrobeItemsForLinking(): Promise<any[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: items, error } = await supabase
    .from("items")
    .select(`
      *,
      brand:brands(*),
      color:colors(*),
      size:sizes(*),
      subcategory:item_subcategories(*)
    `)
    .eq("owner_id", user.id)
    .eq("status", "WARDROBE")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return items || [];
}

