import type { Gender } from "@/types/items";
import { GENDERS } from "@/types/items";
import { cn } from "@/lib/utils";

interface GenderIconProps {
  gender: Gender;
  className?: string;
}

function MenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="10" cy="14" r="5" />
      <path d="M19 5l-5.5 5.5" />
      <path d="M15 5h4v4" />
    </svg>
  );
}

function WomenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v7" />
      <path d="M9 18h6" />
    </svg>
  );
}

function UnisexIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M4.22 4.22l2.12 2.12" />
      <path d="M17.66 17.66l2.12 2.12" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <path d="M4.22 19.78l2.12-2.12" />
      <path d="M17.66 6.34l2.12-2.12" />
    </svg>
  );
}

export function GenderIcon({ gender, className }: GenderIconProps) {
  const label = GENDERS.find((entry) => entry.value === gender)?.label ?? gender;
  const iconClass = cn("h-4 w-4", className);

  return (
    <span className="inline-flex items-center justify-center" title={label} aria-label={label}>
      {gender === "MEN" && <MenIcon className={iconClass} />}
      {gender === "WOMEN" && <WomenIcon className={iconClass} />}
      {gender === "UNISEX" && <UnisexIcon className={iconClass} />}
    </span>
  );
}
