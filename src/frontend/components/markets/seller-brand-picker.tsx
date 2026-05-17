"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Brand } from "@/types/items";
import { cn } from "@/lib/utils";

interface SellerBrandPickerProps {
  brands: Brand[];
  onSelect: (brandId: string) => void;
  placeholder?: string;
}

export function SellerBrandPicker({
  brands,
  onSelect,
  placeholder = "Search and add brands...",
}: SellerBrandPickerProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredBrands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return brands;
    return brands.filter((brand) => brand.name.toLowerCase().includes(normalized));
  }, [brands, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleSelect = (brandId: string) => {
    onSelect(brandId);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "form-combobox-trigger flex w-full items-center justify-between gap-2 rounded-md",
          "border-2 border-brand-lavender bg-background px-3 py-2.5 text-left text-base shadow-sm",
          "text-muted-foreground transition-[color,box-shadow,border-color]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lavender/50 focus-visible:ring-offset-2"
        )}
      >
        <span className="truncate font-normal">{placeholder}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-[100] overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg"
        >
          <div className="border-b border-border/60 p-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search brands..."
              autoFocus
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-lavender/50"
            />
          </div>
          <ul className="max-h-[min(240px,40vh)] overflow-y-auto p-1">
            {filteredBrands.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-muted-foreground">No brand found.</li>
            ) : (
              filteredBrands.map((brand) => (
                <li key={brand.id} role="option">
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2.5 text-left text-base text-foreground transition-colors hover:bg-brand-lavender/25 focus-visible:bg-brand-lavender/25 focus-visible:outline-none"
                    onClick={() => handleSelect(brand.id)}
                  >
                    {brand.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
