import { cn } from "@/lib/utils";

const IVORY_BG_STYLE = { backgroundColor: "hsl(var(--background))" } as const;

interface BrandIvoryIllustrationProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Transparent PNG on page ivory (hsl(var(--background))).
 * Native img preserves PNG alpha; next/image composites transparency onto white.
 * Matches app/auth/sign-in/page.tsx.
 */
export function BrandIvoryIllustration({
  src,
  alt,
  width,
  height,
  className,
}: BrandIvoryIllustrationProps) {
  return (
    <div
      className={cn("relative w-full bg-background", className)}
      style={IVORY_BG_STYLE}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        decoding="async"
        fetchPriority="high"
        className="h-auto w-full bg-background object-contain"
        style={IVORY_BG_STYLE}
      />
    </div>
  );
}
