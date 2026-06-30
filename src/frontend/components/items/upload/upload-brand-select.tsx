"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { createBrand } from "@/lib/data/brands";
import type { Brand } from "@/types/items";
import { cn } from "@/lib/utils";

interface UploadBrandSelectProps {
  brands: Brand[];
  value?: string;
  onChange: (brandId: string) => void;
  onBrandsChange: (brands: Brand[]) => void;
  onError?: (message: string) => void;
  placeholder?: string;
}

export function UploadBrandSelect({
  brands,
  value,
  onChange,
  onBrandsChange,
  onError,
  placeholder = "Select brand",
}: UploadBrandSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedBrand = brands.find((brand) => brand.id === value);

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
    onChange(brandId);
    setQuery("");
    setOpen(false);
  };

  const handleCreateBrand = async () => {
    const trimmed = newBrandName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    const result = await createBrand(trimmed);
    setIsCreating(false);

    if (result.success) {
      const updated = [...brands, result.brand].sort((a, b) => a.name.localeCompare(b.name));
      onBrandsChange(updated);
      onChange(result.brand.id);
      setNewBrandName("");
      setShowNewBrand(false);
      setQuery("");
      setOpen(false);
      return;
    }

    onError?.(`Failed to create brand: ${result.error}`);
  };

  return (
    <div>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "form-combobox-trigger form-combobox-trigger--inline w-full",
            !selectedBrand && "form-combobox-trigger--placeholder"
          )}
        >
          <span className="form-combobox-trigger-label truncate">
            {selectedBrand?.name ?? placeholder}
          </span>
          <ChevronDown
            className={cn("form-combobox-chevron transition-transform", open && "rotate-180")}
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
                  <li key={brand.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === brand.id}
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left text-base transition-colors hover:bg-brand-lavender/25 focus-visible:bg-brand-lavender/25 focus-visible:outline-none",
                        value === brand.id && "bg-brand-purple/10 font-medium text-brand-purple"
                      )}
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

      {!showNewBrand ? (
        <button
          type="button"
          onClick={() => setShowNewBrand(true)}
          className="mt-2 text-xs font-medium text-brand-purple"
        >
          + Add new brand
        </button>
      ) : (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newBrandName}
            onChange={(event) => setNewBrandName(event.target.value)}
            placeholder="Brand name"
            className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreateBrand();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void handleCreateBrand()}
            disabled={isCreating || !newBrandName.trim()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {isCreating ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowNewBrand(false);
              setNewBrandName("");
            }}
            className="rounded-lg border border-input px-3 py-1.5 text-xs font-medium"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
