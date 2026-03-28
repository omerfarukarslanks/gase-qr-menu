"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Store } from "lucide-react";
import { adminNavItems } from "@/components/admin/admin-nav";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

interface SidebarProps {
  collapsed?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({
  collapsed = false,
  mobile = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isRail = collapsed && !mobile;

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-card text-foreground",
        mobile ? "w-full" : "border-r border-border"
      )}
    >
      <div className={cn("border-b border-border px-4 py-5", isRail && "px-3")}>
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-3 rounded-[1.25rem]",
            isRail && "justify-center"
          )}
          onClick={onNavigate}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <Store className="h-5 w-5" />
          </div>
          {!isRail && (
            <div>
              <p className="font-display text-[28px] leading-[30px] text-foreground">
                GASE
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Indigo admin
              </p>
            </div>
          )}
        </Link>

        {!isRail && (
          <div
            className="mt-5 rounded-[1.5rem] border border-border p-4"
            style={{ backgroundImage: "var(--hero-glow)" }}
          >
            <div className="rounded-[1.1rem] bg-background/85 p-4 backdrop-blur">
              <p className="text-sm font-semibold text-foreground">
                {user?.name || user?.email}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Operasyon, menuler ve stok hareketleri tek navigasyon icinde.
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className={cn("flex-1 space-y-1.5 overflow-y-auto px-3 py-4", isRail && "px-2")}>
        {adminNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-label={item.label}
              title={isRail ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-semibold transition-all duration-200",
                isRail && "justify-center px-0",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[var(--card-shadow)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isRail && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-border px-3 py-4", isRail && "px-2")}>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground",
            isRail && "justify-center px-0"
          )}
          onClick={() => {
            logout();
            router.replace("/login");
            onNavigate?.();
          }}
          title={isRail ? "Cikis yap" : undefined}
          aria-label="Cikis yap"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isRail && <span>Cikis yap</span>}
        </button>
      </div>
    </aside>
  );
}
