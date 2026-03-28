"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface AdminDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
}

export function AdminDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  contentClassName,
  bodyClassName,
}: AdminDrawerProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "overflow-hidden border-border bg-card/98 p-0 backdrop-blur-xl",
          isDesktop
            ? "h-screen w-[min(46rem,calc(100vw-2rem))] max-w-none"
            : "h-[100dvh] max-h-[100dvh] w-screen max-w-none rounded-none",
          contentClassName
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-border bg-background/92 px-6 py-5 backdrop-blur">
            <SheetHeader className="space-y-1 pr-12">
              <SheetTitle>{title}</SheetTitle>
              {description ? <SheetDescription>{description}</SheetDescription> : null}
            </SheetHeader>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]",
              bodyClassName
            )}
          >
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
