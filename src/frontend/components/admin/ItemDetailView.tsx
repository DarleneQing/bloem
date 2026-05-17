"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  User,
  Calendar,
  Euro,
  Tag,
  Palette,
  Ruler,
  Star,
  Store,
  CheckCircle,
  Trash2,
} from "lucide-react";
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  type ItemStatus,
  type ItemCategory,
  type ItemCondition,
} from "@/types/items";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  brand: string | null;
  category: ItemCategory;
  size: string | null;
  condition: ItemCondition;
  color: string | null;
  selling_price: number | null;
  status: ItemStatus;
  image_urls: string[];
  thumbnail_url: string;
  market_id: string | null;
  listed_at: string | null;
  sold_at: string | null;
  buyer_id: string | null;
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  buyer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  market?: {
    id: string;
    name: string;
    location_name: string;
    location_address: string;
  };
}

interface ItemDetailViewProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (item: Item) => void;
  onStatusChange: (itemId: string, newStatus: ItemStatus) => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number | null) {
  if (price == null) return "Not set";
  return `CHF ${price.toFixed(2)}`;
}

function getStatusBadgeClass(status: ItemStatus) {
  switch (status) {
    case "RACK":
      return "bg-emerald-100 text-emerald-800";
    case "SOLD":
      return "bg-brand-lavender/40 text-brand-purple";
    case "RESERVED":
      return "bg-amber-100 text-amber-800";
    case "WARDROBE":
    default:
      return "bg-orange-100 text-orange-800";
  }
}

function getConditionStars(condition: string) {
  const conditionMap: Record<string, number> = {
    NEW_WITH_TAGS: 5,
    LIKE_NEW: 4,
    EXCELLENT: 3,
    GOOD: 2,
    FAIR: 1,
  };

  const stars = conditionMap[condition] ?? 0;
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={cn(
        "h-3.5 w-3.5",
        i < stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
      )}
    />
  ));
}

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

export function ItemDetailView({
  item,
  isOpen,
  onClose,
  onDelete,
  onStatusChange,
}: ItemDetailViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState<ItemStatus | null>(null);

  if (!item) return null;

  const categoryLabel =
    ITEM_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category;
  const conditionLabel =
    ITEM_CONDITIONS.find((c) => c.value === item.condition)?.label ?? item.condition;

  const handleStatusChange = async (newStatus: ItemStatus) => {
    try {
      setActionLoading(newStatus);
      const response = await fetch("/api/admin/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          updates: {
            status: newStatus,
            ...(newStatus === "RACK" && { listed_at: new Date().toISOString() }),
            ...(newStatus === "SOLD" && { sold_at: new Date().toISOString() }),
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        onStatusChange(item.id, newStatus);
        onClose();
      }
    } catch (err) {
      console.error("Error updating item status:", err);
    } finally {
      setActionLoading(null);
    }
  };

  type FooterAction = {
    key: string;
    label: string;
    icon: React.ReactNode;
    variant?: "default" | "outline" | "destructive";
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
  };

  const footerActions: FooterAction[] = [];

  if (item.status !== "SOLD") {
    footerActions.push({
      key: "sold",
      label: "Sold",
      icon: <CheckCircle className="h-4 w-4 shrink-0" />,
      variant: "default",
      onClick: () => handleStatusChange("SOLD"),
      disabled: actionLoading !== null,
      loading: actionLoading === "SOLD",
    });
  }
  if (item.status !== "RACK") {
    footerActions.push({
      key: "rack",
      label: "Rack",
      icon: <Store className="h-4 w-4 shrink-0" />,
      variant: "outline",
      onClick: () => handleStatusChange("RACK"),
      disabled: actionLoading !== null,
      loading: actionLoading === "RACK",
    });
  }
  if (item.status !== "WARDROBE") {
    footerActions.push({
      key: "wardrobe",
      label: "Wardrobe",
      icon: <Package className="h-4 w-4 shrink-0" />,
      variant: "outline",
      onClick: () => handleStatusChange("WARDROBE"),
      disabled: actionLoading !== null,
      loading: actionLoading === "WARDROBE",
    });
  }

  footerActions.push({
    key: "delete",
    label: "Delete",
    icon: <Trash2 className="h-4 w-4 shrink-0" />,
    variant: "outline",
    onClick: () => {
      onClose();
      onDelete(item);
    },
    className:
      "text-destructive hover:bg-destructive/5 hover:text-destructive",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex max-h-[100dvh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0",
          "inset-x-0 bottom-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl",
          "sm:inset-auto sm:left-[50%] sm:top-[50%] sm:max-h-[90vh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg"
        )}
      >
        <DialogHeader className="shrink-0 space-y-3 border-b border-border/70 px-4 pb-4 pt-5 pr-12 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("shrink-0", getStatusBadgeClass(item.status))}>
              {item.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {item.brand || "No brand"} · {categoryLabel}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold leading-snug sm:text-2xl">
            {item.title}
          </DialogTitle>
          <DialogDescription className="text-base font-semibold text-foreground">
            {formatPrice(item.selling_price)}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl bg-muted">
              <div className="relative aspect-[4/5] w-full max-h-[min(50vh,420px)] sm:max-h-[360px]">
                {item.image_urls?.length > 0 ? (
                  <Image
                    src={item.image_urls[currentImageIndex]}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 480px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-14 w-14 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {item.image_urls && item.image_urls.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto border-t border-border/50 p-3">
                  {item.image_urls.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-muted",
                        index === currentImageIndex
                          ? "border-brand-purple"
                          : "border-transparent"
                      )}
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {item.description ? (
              <DetailSection title="Description">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </DetailSection>
            ) : null}

            <DetailSection title="Item details">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailRow
                  icon={<Tag className="h-4 w-4" />}
                  label="Category"
                  value={categoryLabel}
                />
                <DetailRow
                  icon={<Ruler className="h-4 w-4" />}
                  label="Size"
                  value={item.size || "Not specified"}
                />
                <DetailRow
                  icon={<Palette className="h-4 w-4" />}
                  label="Color"
                  value={item.color || "Not specified"}
                />
                <DetailRow
                  icon={<Euro className="h-4 w-4" />}
                  label="Price"
                  value={formatPrice(item.selling_price)}
                />
              </div>
              <div className="mt-4 border-t border-border/50 pt-4">
                <p className="text-xs font-medium text-muted-foreground">Condition</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{conditionLabel}</span>
                  <div className="flex items-center gap-0.5">{getConditionStars(item.condition)}</div>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Owner information">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-purple/10">
                  {item.owner.avatar_url ? (
                    <Image
                      src={item.owner.avatar_url}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-brand-purple" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.owner.first_name} {item.owner.last_name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{item.owner.email}</p>
                </div>
              </div>
            </DetailSection>

            {item.status === "SOLD" && item.buyer ? (
              <DetailSection title="Buyer information">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <User className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {item.buyer.first_name} {item.buyer.last_name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{item.buyer.email}</p>
                  </div>
                </div>
              </DetailSection>
            ) : null}

            {item.market ? (
              <DetailSection title="Market information">
                <div className="flex items-start gap-3">
                  <Store className="mt-0.5 h-5 w-5 shrink-0 text-brand-purple" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium">{item.market.name}</p>
                    {item.market.location_name ? (
                      <p className="text-sm text-muted-foreground">{item.market.location_name}</p>
                    ) : null}
                    {item.market.location_address ? (
                      <p className="break-words text-sm text-muted-foreground">
                        {item.market.location_address}
                      </p>
                    ) : null}
                  </div>
                </div>
              </DetailSection>
            ) : null}

            <DetailSection title="Timeline">
              <div className="space-y-4">
                <DetailRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Created"
                  value={formatDate(item.created_at)}
                />
                {item.listed_at ? (
                  <DetailRow
                    icon={<Store className="h-4 w-4" />}
                    label="Listed"
                    value={formatDate(item.listed_at)}
                  />
                ) : null}
                {item.sold_at ? (
                  <DetailRow
                    icon={<CheckCircle className="h-4 w-4" />}
                    label="Sold"
                    value={formatDate(item.sold_at)}
                  />
                ) : null}
              </div>
            </DetailSection>
          </div>
        </div>

        <footer
          className="shrink-0 border-t border-border/70 bg-background px-3 py-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex gap-2">
            {footerActions.map((action) => (
              <Button
                key={action.key}
                type="button"
                variant={action.variant ?? "outline"}
                className={cn(
                  "h-10 min-w-0 flex-1 gap-1.5 px-2 text-xs sm:h-11 sm:px-3 sm:text-sm",
                  action.className
                )}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.loading ? (
                  <span className="truncate">…</span>
                ) : (
                  <>
                    {action.icon}
                    <span className="truncate">{action.label}</span>
                  </>
                )}
              </Button>
            ))}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
