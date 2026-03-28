"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { getAdminPageTitle } from "@/components/admin/admin-nav";
import { Sidebar } from "@/components/admin/sidebar";
import { StoreOnboardingCard } from "@/components/admin/store-onboarding-card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuthStore } from "@/lib/store";
import { useStores } from "@/hooks/use-stores";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { Button } from "@/components/ui/button";

const SIDEBAR_STORAGE_KEY = "gase-admin-sidebar-collapsed";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasHydrated = useAuthHydration();
  const isAuthenticated = useAuthStore(
    (state) => Boolean(state.isAuthenticated && state.user && state.accessToken)
  );
  const stores = useAuthStore((state) => state.stores);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const setStores = useAuthStore((state) => state.setStores);
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId);
  const logout = useAuthStore((state) => state.logout);

  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [hasLoadedSidebarState, setHasLoadedSidebarState] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: storesResponse, isLoading, isError, error, refetch } = useStores(
    hasHydrated && isAuthenticated
  );

  useEffect(() => {
    const savedValue =
      typeof window !== "undefined"
        ? window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
        : null;

    setIsDesktopCollapsed(savedValue === "true");
    setHasLoadedSidebarState(true);
  }, []);

  useEffect(() => {
    if (hasLoadedSidebarState && typeof window !== "undefined") {
      window.localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        String(isDesktopCollapsed)
      );
    }
  }, [hasLoadedSidebarState, isDesktopCollapsed]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      const next = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [hasHydrated, isAuthenticated, pathname, router, searchParams]);

  useEffect(() => {
    if (storesResponse?.data) {
      setStores(storesResponse.data);
    }
  }, [setStores, storesResponse]);

  if (!hasHydrated) {
    return (
      <div className="theme-app-gradient flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Oturum kontrol ediliyor...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading && stores.length === 0) {
    return (
      <div className="theme-app-gradient flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Magaza bilgileri yukleniyor...
        </div>
      </div>
    );
  }

  if (isError && stores.length === 0) {
    return (
      <div className="theme-app-gradient flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-card p-7 text-center shadow-[var(--card-shadow)]">
          <h1 className="text-xl font-semibold">Magazalara erisilemedi</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Store listesi alinamadi. Token veya backend baglantisini kontrol edin."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              Tekrar dene
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              Cikis yap
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <StoreOnboardingCard
        onReady={() => refetch()}
        onLogout={() => {
          logout();
          router.replace("/login");
        }}
      />
    );
  }

  const pageTitle = getAdminPageTitle(pathname);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside
        className={`hidden h-screen shrink-0 border-r border-border bg-card lg:flex ${
          isDesktopCollapsed ? "w-[5.5rem]" : "w-80"
        }`}
      >
        <Sidebar collapsed={isDesktopCollapsed} />
      </aside>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[min(92vw,24rem)] p-0 lg:hidden">
          <Sidebar mobile onNavigate={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="theme-app-gradient flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          title={pageTitle}
          stores={stores}
          activeStoreId={activeStoreId}
          onStoreChange={setActiveStoreId}
          collapsed={isDesktopCollapsed}
          onToggleCollapsed={() => setIsDesktopCollapsed((current) => !current)}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto min-h-[calc(100vh-9rem)] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
