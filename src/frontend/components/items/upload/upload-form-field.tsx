"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UploadFormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function UploadFormField({ label, error, children, className }: UploadFormFieldProps) {
  return (
    <div className={cn("border-b border-border/60 px-4 py-3.5 last:border-b-0", className)}>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export interface UploadSelectOption {
  value: string;
  label: string;
}

interface UploadSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: UploadSelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function UploadSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  disabled,
}: UploadSelectProps) {
  const selected = value && value.length > 0 ? value : undefined;

  return (
    <Select
      value={selected}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger variant="inline">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" sideOffset={4}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
