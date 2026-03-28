"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-muted transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30",
        className
      )}
      onClick={() => {
        if (disabled) {
          return;
        }

        onCheckedChange?.(!checked);
      }}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  )
);

Switch.displayName = "Switch";

export { Switch };
