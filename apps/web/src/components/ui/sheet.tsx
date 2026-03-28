"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;
const SheetPortal = Dialog.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-overlay-show data-[state=closed]:animate-overlay-hide motion-reduce:animate-none",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = Dialog.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 border border-border bg-card p-6 shadow-[var(--card-shadow-hover)] transform-gpu will-change-transform motion-reduce:animate-none",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 rounded-b-[1.75rem] data-[state=open]:animate-sheet-in-from-top data-[state=closed]:animate-sheet-out-to-top",
        bottom:
          "inset-x-0 bottom-0 rounded-t-[1.75rem] data-[state=open]:animate-sheet-in-from-bottom data-[state=closed]:animate-sheet-out-to-bottom",
        left: "inset-y-0 left-0 h-full w-[min(92vw,24rem)] rounded-r-[1.75rem] data-[state=open]:animate-sheet-in-from-left data-[state=closed]:animate-sheet-out-to-left",
        right:
          "inset-y-0 right-0 h-full w-[min(92vw,24rem)] rounded-l-[1.75rem] data-[state=open]:animate-sheet-in-from-right data-[state=closed]:animate-sheet-out-to-right",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof Dialog.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <Dialog.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <Dialog.Close className="absolute right-4 top-4 rounded-full border border-border bg-background/85 p-2 text-muted-foreground transition-colors hover:text-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Kapat</span>
      </Dialog.Close>
    </Dialog.Content>
  </SheetPortal>
));
SheetContent.displayName = Dialog.Content.displayName;

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-2", className)} {...props} />;
}

function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = Dialog.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className={cn("text-sm leading-6 text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = Dialog.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
