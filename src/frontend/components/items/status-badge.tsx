interface StatusBadgeProps {
  status: string;
  className?: string;
  variant?: "default" | "overlay" | "detail";
}

export function StatusBadge({ status, className = "", variant = "default" }: StatusBadgeProps) {
  const detailConfig: Record<string, { label: string; color: string }> = {
    WARDROBE: {
      label: "Display",
      color: "bg-brand-lavender text-primary border-transparent",
    },
    WARDROBE_PUBLIC: {
      label: "Display",
      color: "bg-brand-lavender text-primary border-transparent",
    },
    WARDROBE_PRIVATE: {
      label: "Private",
      color: "bg-brand-lavender text-primary border-transparent",
    },
    RACK: {
      label: "For Sale",
      color: "bg-brand-accent text-accent-foreground border-transparent",
    },
    LISTED: {
      label: "For Sale",
      color: "bg-brand-accent text-accent-foreground border-transparent",
    },
    SOLD: {
      label: "Sold",
      color: "bg-brand-accent text-accent-foreground border-transparent",
    },
  };

  const overlayConfig: Record<string, { label: string; color: string }> = {
    WARDROBE: {
      label: "Display",
      color: "bg-brand-lavender/95 text-primary border-transparent backdrop-blur-sm",
    },
    WARDROBE_PUBLIC: {
      label: "Display",
      color: "bg-brand-lavender/95 text-primary border-transparent backdrop-blur-sm",
    },
    WARDROBE_PRIVATE: {
      label: "Private",
      color: "bg-brand-lavender/95 text-primary border-transparent backdrop-blur-sm",
    },
    RACK: {
      label: "For Sale",
      color: "bg-brand-accent/95 text-accent-foreground border-transparent backdrop-blur-sm",
    },
    LISTED: {
      label: "For Sale",
      color: "bg-brand-accent/95 text-accent-foreground border-transparent backdrop-blur-sm",
    },
    SOLD: {
      label: "Sold",
      color: "bg-brand-accent/95 text-accent-foreground border-transparent backdrop-blur-sm",
    },
  };

  const statusConfig: Record<
    string,
    { label: string; color: string }
  > = {
    WARDROBE: {
      label: "In Wardrobe",
      color: "bg-green-100 text-green-800 border-green-200",
    },
    WARDROBE_PUBLIC: {
      label: "In Wardrobe",
      color: "bg-green-100 text-green-800 border-green-200",
    },
    WARDROBE_PRIVATE: {
      label: "Private",
      color: "bg-gray-100 text-gray-800 border-gray-200",
    },
    RACK: {
      label: "Ready to Sell",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    },
    LISTED: {
      label: "At Market",
      color: "bg-purple-100 text-purple-800 border-purple-200",
    },
    SOLD: {
      label: "Sold",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    },
  };

  const config =
    (variant === "overlay" ? overlayConfig[status] : undefined) ??
    (variant === "detail" ? detailConfig[status] : undefined) ??
    statusConfig[status] ?? {
      label: status,
      color:
        variant === "overlay"
          ? "bg-foreground/70 text-background border-transparent backdrop-blur-sm"
          : "bg-gray-100 text-gray-800 border-gray-200",
    };

  const sizeClass =
    variant === "detail" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold border ${sizeClass} ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}

