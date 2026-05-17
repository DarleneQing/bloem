"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange && !disabled) {
        onCheckedChange(e.target.checked);
      }
    };

    return (
      <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          id={id}
          className="sr-only peer"
          {...props}
        />
        <div className="relative h-6 w-11 shrink-0 rounded-full bg-gradient-to-bl from-neutral-800 via-neutral-700 to-neutral-600 shadow-md outline-none ring-0 transition-colors duration-300 peer-focus:outline-none peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-brand-purple after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-[conic-gradient(from_135deg,#b2a9a9,#b2a8a8,#fff,#d7dbd9,#fff,#b2a8a8)] after:shadow-sm after:transition-transform after:duration-300 after:content-[''] peer-checked:after:translate-x-5 peer-hover:after:scale-95 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
      </label>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
