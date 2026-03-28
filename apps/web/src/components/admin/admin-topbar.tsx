"use client";

import { ChevronLeft, Menu, PanelLeftClose, PanelLeftOpen, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminNotifications } from "@/components/admin/admin-notifications";
import { cn } from "@/lib/utils";
import type { StoreSummary } from "@/lib/auth-session";

interface AdminTopbarProps {
  title: string;
  stores: StoreSummary[];
  activeStoreId: string | null;
  onStoreChange: (storeId: string | null) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenMobileMenu: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function AdminTopbar({
  title,
  stores,
  activeStoreId,
  onStoreChange,
  collapsed,
  onToggleCollapsed,
  onOpenMobileMenu,
  showBackButton = false,
  onBack,
}: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full lg:hidden"
              onClick={onOpenMobileMenu}
            >
              <Menu className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden rounded-full lg:inline-flex"
              onClick={onToggleCollapsed}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>

            {showBackButton && onBack && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={onBack}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                GASE admin
              </p>
              <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminNotifications />
            <ThemeToggle compact />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/75 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-[var(--card-shadow)]">
            <Store className="h-3.5 w-3.5" />
            Aktif magaza baglami
          </div>

          <label className="flex w-full items-center gap-3 rounded-[1.2rem] border border-border bg-card/75 px-4 py-3 shadow-[var(--card-shadow)] sm:max-w-sm">
            <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
            <select
              className={cn(
                "w-full bg-transparent text-sm font-medium text-foreground outline-none",
                stores.length === 0 && "text-muted-foreground"
              )}
              value={activeStoreId ?? ""}
              onChange={(event) => onStoreChange(event.target.value || null)}
            >
              {stores.length === 0 ? (
                <option value="">Magaza bulunamadi</option>
              ) : (
                stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}
