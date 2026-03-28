"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({
  className,
  compact = false,
}: ThemeToggleProps) {
  const { mounted, theme, toggleTheme } = useTheme();

  const isDark = mounted ? theme === "dark" : false;
  const label = mounted ? (isDark ? "Dark mode" : "Light mode") : "Tema";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "group relative overflow-hidden rounded-full border-border bg-card/80 backdrop-blur transition-[background-color,border-color,color,box-shadow,transform] duration-300",
        compact
          ? "h-10 min-w-[4.6rem] px-1.5 shadow-[var(--card-shadow)] hover:scale-[1.03] active:scale-95"
          : "gap-3 px-2.5 shadow-[var(--card-shadow)] hover:translate-y-[-1px] hover:shadow-[var(--card-shadow-hover)]",
        className
      )}
      onClick={toggleTheme}
      aria-label={`${isDark ? "Light" : "Dark"} mode'a gec`}
      title={`${isDark ? "Light" : "Dark"} mode'a gec`}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          isDark
            ? "bg-[radial-gradient(circle_at_top,rgba(165,180,252,0.24),transparent_60%)]"
            : "bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.18),transparent_60%)]"
        )}
      />
      <span
        className={cn(
          "relative flex h-7 w-12 shrink-0 items-center rounded-full border border-border/60 px-1 transition-all duration-300 ease-out",
          isDark
            ? "bg-secondary/80 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            : "bg-secondary/90 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
        )}
      >
        <SunMedium
          className={cn(
            "absolute left-[0.38rem] h-3.5 w-3.5 transition-all duration-300",
            isDark ? "scale-75 opacity-40" : "scale-100 opacity-100 text-[hsl(var(--brand-600))]"
          )}
        />
        <MoonStar
          className={cn(
            "absolute right-[0.38rem] h-3.5 w-3.5 transition-all duration-300",
            isDark ? "scale-100 opacity-100 text-primary" : "scale-75 opacity-40"
          )}
        />
        <SunMedium
          className={cn(
            "absolute left-1 z-10 h-5 w-5 rounded-full p-0.5 transition-all duration-300",
            isDark ? "translate-x-5 rotate-[-35deg] scale-75 opacity-0" : "translate-x-0 rotate-0 scale-100 opacity-100"
          )}
        />
        <MoonStar
          className={cn(
            "absolute left-1 z-10 h-5 w-5 rounded-full p-0.5 transition-all duration-300",
            isDark ? "translate-x-5 rotate-0 scale-100 opacity-100" : "translate-x-0 rotate-[35deg] scale-75 opacity-0"
          )}
        />
        <span
          className={cn(
            "absolute left-1 h-5 w-5 rounded-full shadow-[0_10px_24px_-16px_rgba(15,23,42,0.4)] transition-all duration-300 ease-out",
            isDark
              ? "translate-x-5 bg-primary"
              : "translate-x-0 bg-background"
          )}
        />
      </span>
      {!compact && (
        <span className="relative pr-1 text-sm font-semibold">{label}</span>
      )}
    </Button>
  );
}
