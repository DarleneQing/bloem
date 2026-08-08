import Image from "next/image";
import { StaggerItem } from "@/components/ui/motion";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageClassName?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export function StepCard({
  stepNumber,
  title,
  description,
  imageSrc,
  imageAlt,
  imageClassName = "object-cover",
  imageWidth,
  imageHeight,
}: StepCardProps) {
  const hasExplicitDimensions = imageWidth !== undefined && imageHeight !== undefined;
  const bgClass = imageClassName.includes("bg-") ? "" : "bg-muted";

  return (
    <StaggerItem>
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md p-6 transition-all duration-300 h-full">
        <div className="w-14 h-14 rounded-full bg-brand-lavender flex items-center justify-center mb-4">
          <span className="text-2xl font-bold text-white">{stepNumber}</span>
        </div>
        <h3 className="text-xl font-bold mb-2 leading-snug">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{description}</p>
        <div className={`relative w-full h-48 rounded-xl overflow-hidden ${bgClass}`}>
          {hasExplicitDimensions ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={imageWidth}
              height={imageHeight}
              className={imageClassName}
            />
          ) : (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className={imageClassName}
            />
          )}
        </div>
      </div>
    </StaggerItem>
  );
}

