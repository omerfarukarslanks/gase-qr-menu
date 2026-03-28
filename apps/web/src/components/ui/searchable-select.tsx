"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  keywords?: string[];
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  mode?: "single" | "multiple";
  name?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  mode = "single",
  name,
  required = false,
  placeholder = "Secim yapin",
  searchPlaceholder = "Secenek ara...",
  emptyMessage = "Sonuc bulunamadi.",
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedValues = useMemo(() => {
    if (mode === "multiple") {
      return Array.isArray(value) ? value : value ? [value] : [];
    }

    if (Array.isArray(value)) {
      return value[0] ? [value[0]] : [];
    }

    return value ? [value] : [];
  }, [mode, value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystacks = [option.label, option.value, ...(option.keywords ?? [])];
      return haystacks.some((item) => item.toLowerCase().includes(normalizedQuery));
    });
  }, [options, query]);

  const triggerLabel = useMemo(() => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    if (mode === "multiple") {
      if (selectedValues.length === 1) {
        return options.find((option) => option.value === selectedValues[0])?.label ?? placeholder;
      }

      return `${selectedValues.length} secenek secildi`;
    }

    return options.find((option) => option.value === selectedValues[0])?.label ?? placeholder;
  }, [mode, options, placeholder, selectedValues]);

  useEffect(() => {
    if (selectedValues.length > 0) {
      setIsInvalid(false);
    }
  }, [selectedValues]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);

    return () => window.clearTimeout(timer);
  }, [open]);

  const toggleValue = (nextValue: string) => {
    if (mode === "multiple") {
      const nextValues = selectedValues.includes(nextValue)
        ? selectedValues.filter((item) => item !== nextValue)
        : [...selectedValues, nextValue];

      onChange(nextValues);
      return;
    }

    onChange(nextValue);
    setOpen(false);
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          type="button"
          aria-invalid={isInvalid}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-3 rounded-[1rem] border border-input bg-background px-3 py-2 text-left text-sm shadow-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive aria-[invalid=true]:bg-destructive/5 aria-[invalid=true]:focus-visible:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50",
            className,
            triggerClassName
          )}
        >
          <span
            className={cn(
              "truncate",
              selectedValues.length === 0 && "text-muted-foreground"
            )}
          >
            {triggerLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>
      <input
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none absolute h-0 w-0 opacity-0"
        name={name}
        required={required}
        value={selectedValues.join(",")}
        onChange={() => undefined}
        onInvalid={() => setIsInvalid(true)}
      />

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className={cn(
            "z-50 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[14rem] rounded-[1.25rem] border border-border bg-popover p-2 shadow-[var(--card-shadow-hover)]",
            contentClassName
          )}
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder={searchPlaceholder}
              className="flex h-10 w-full rounded-[0.9rem] border border-input bg-background px-3 py-2 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => toggleValue(option.value)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[0.9rem] px-3 py-2 text-left text-sm transition-colors",
                      option.disabled
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-muted focus:bg-muted",
                      isSelected && "bg-muted/80"
                    )}
                  >
                    {mode === "multiple" ? (
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background",
                          isSelected && "border-primary bg-primary text-primary-foreground"
                        )}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : null}
                      </span>
                    ) : (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
                      </span>
                    )}
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
