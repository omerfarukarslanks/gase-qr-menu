"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Store } from "lucide-react";
import { Sidebar } from "@/components/admin/sidebar";
import { StoreOnboardingCard } from "@/components/admin/store-onboarding-card";
import { useAuthStore } from "@/lib/store";
import { useStores } from "@/hooks/use-stores";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { Button } from "@/components/ui/button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasHydrated = useAuthHydration();
  const isAuthenticated = useAuthStore(
    (state) => Boolean(state.isAuthenticated && state.user && state.accessToken)
  );
  const stores = useAuthStore((state) => state.stores);
  const setStores = useAuthStore((state) => state.setStores);
  const logout = useAuthStore((state) => state.logout);

  const { data: storesResponse, isLoading, isError, error, refetch } = useStores(
    hasHydrated && isAuthenticated
  );

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
      <div className="flex min-h-screen items-center justify-center">
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Magaza bilgileri yukleniyor...
        </div>
      </div>
    );
  }

  if (isError && stores.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center">
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
    </div>
  );
}
