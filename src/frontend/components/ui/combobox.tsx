"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  variant?: "default" | "inline"
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  variant = "default",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const comboboxId = React.useId()
  const isInline = variant === "inline"
  const selectedLabel = value
    ? options.find((option) => option.value === value)?.label
    : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={`combobox-${comboboxId}`}
          className={cn(
            "form-combobox-trigger",
            isInline && "form-combobox-trigger--inline",
            !selectedLabel && isInline && "form-combobox-trigger--placeholder",
            className
          )}
        >
          <span className="form-combobox-trigger-label truncate">
            {selectedLabel ?? placeholder}
          </span>
          {isInline ? (
            <ChevronDown className="form-combobox-chevron" aria-hidden />
          ) : (
            <ChevronsUpDown className="form-combobox-chevron opacity-50" aria-hidden />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="form-select-content w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <Command id={`combobox-${comboboxId}`} shouldFilter loop>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  className="form-select-item cursor-pointer"
                  onSelect={(currentValue) => {
                    const selectedOption = options.find((opt) => opt.label.toLowerCase() === currentValue.toLowerCase())
                    if (selectedOption) {
                      onChange(selectedOption.value === value ? "" : selectedOption.value)
                      setOpen(false)
                    }
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 text-brand-purple",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
