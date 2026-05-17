"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface FeaturedVendor {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface MarketFeaturedVendorsProps {
  marketId: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function MarketFeaturedVendors({ marketId }: MarketFeaturedVendorsProps) {
  const [vendors, setVendors] = useState<FeaturedVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("items")
        .select(
          `
          owner_id,
          owner:profiles!items_owner_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `
        )
        .eq("market_id", marketId)
        .eq("status", "RACK")
        .limit(24);

      if (!active) return;

      if (error || !data) {
        setVendors([]);
        setLoading(false);
        return;
      }

      const byOwner = new Map<string, FeaturedVendor>();
      for (const row of data) {
        const owner = row.owner as {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
        } | null;
        const ownerId = owner?.id ?? row.owner_id;
        if (!ownerId || byOwner.has(ownerId)) continue;

        const name = [owner?.first_name, owner?.last_name].filter(Boolean).join(" ").trim() || "Vendor";
        byOwner.set(ownerId, {
          id: ownerId,
          name,
          avatarUrl: owner?.avatar_url,
        });
      }

      setVendors(Array.from(byOwner.values()).slice(0, 8));
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [marketId]);

  if (loading || vendors.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Featured vendors</h2>
        <span className="text-sm font-medium text-primary">{vendors.length} selling</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-1 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="flex w-[4.5rem] shrink-0 flex-col items-center gap-2">
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-brand-lavender/30 ring-2 ring-background">
              {vendor.avatarUrl ? (
                <Image
                  src={vendor.avatarUrl}
                  alt={vendor.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
                  {getInitials(vendor.name)}
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-center text-xs font-medium text-foreground">{vendor.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
