"use client";

import { useEffect, useState } from "react";
import { AUTH_STORAGE_KEY, type AuthUser, type StoreSummary } from "@/lib/auth-session";
import { useAuthStore } from "@/lib/store";

interface PersistedAuthState {
  user?: AuthUser | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  stores?: StoreSummary[];
  activeStoreId?: string | null;
  isAuthenticated?: boolean;
}

function readPersistedAuthState(): PersistedAuthState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { state?: PersistedAuthState };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

interface AuthPersistController {
  hasHydrated?: () => boolean;
  rehydrate?: () => Promise<void> | void;
  onFinishHydration?: (listener: () => void) => () => void;
}

function restorePersistedSession() {
  const persistedState = readPersistedAuthState();

  if (persistedState?.user && persistedState.accessToken) {
    useAuthStore.setState({
      user: persistedState.user,
      accessToken: persistedState.accessToken,
      refreshToken: persistedState.refreshToken ?? null,
      stores: persistedState.stores ?? [],
      activeStoreId: persistedState.activeStoreId ?? null,
      isAuthenticated: persistedState.isAuthenticated ?? true,
      hasHydrated: true,
    });
    return;
  }

  useAuthStore.getState().markHydrated();
}

export function useAuthHydration() {
  const storeHydrated = useAuthStore((state) => state.hasHydrated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const authStore = useAuthStore as typeof useAuthStore & {
      persist?: AuthPersistController;
    };
    const persist = authStore.persist;

    const finish = () => {
      if (!isCancelled) {
        setIsReady(true);
      }
    };

    if (!persist?.rehydrate) {
      restorePersistedSession();
      finish();
      return () => {
        isCancelled = true;
      };
    }

    if (persist.hasHydrated?.()) {
      useAuthStore.getState().markHydrated();
      finish();
      return () => {
        isCancelled = true;
      };
    }

    const unsubscribeFinish = persist.onFinishHydration?.(() => {
      finish();
    });

    Promise.resolve(persist.rehydrate())
      .catch(() => {
        restorePersistedSession();
      })
      .finally(() => {
        if (!useAuthStore.getState().hasHydrated) {
          useAuthStore.getState().markHydrated();
        }
        finish();
      });

    return () => {
      isCancelled = true;
      unsubscribeFinish?.();
    };
  }, []);

  return isReady && storeHydrated;
}
