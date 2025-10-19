interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
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

  const config = statusConfig[status] || {
    label: status,
    color: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
}

