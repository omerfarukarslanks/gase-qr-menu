import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  actionClassName?: string;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  action,
  actionClassName,
  className,
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="max-w-3xl">
        <h1 className="text-[30px] font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action && (
        <div className={cn("flex w-full flex-col gap-2 sm:w-auto sm:flex-row", actionClassName)}>
          {action}
        </div>
      )}
    </div>
  );
}
