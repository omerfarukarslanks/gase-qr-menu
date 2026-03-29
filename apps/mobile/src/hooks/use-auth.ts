import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { StoreSummary } from '@gase/shared';
import { api, unwrapApiData } from '../lib/api';
import { useAuthStore, type AuthUser } from '../stores/auth-store';
import { useCartStore } from '../stores/cart-store';
import { usePreferencesStore } from '../stores/preferences-store';

type AuthPayload = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

async function fetchStores() {
  const response = await api.get('/api/stores');
  return unwrapApiData<StoreSummary[]>(response.data);
}

export function useBootstrapState() {
  const [ready, setReady] = useState(false);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const cartHydrated = useCartStore((state) => state.hydrated);
  const preferencesHydrated = usePreferencesStore((state) => state.hydrated);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hydrateCart = useCartStore((state) => state.hydrate);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);

  useEffect(() => {
    let mounted = true;

    Promise.all([hydrateAuth(), hydrateCart(), hydratePreferences()]).finally(() => {
      if (mounted) {
        setReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [hydrateAuth, hydrateCart, hydratePreferences]);

  return ready && authHydrated && cartHydrated && preferencesHydrated;
}

export function useSyncStores(enabled: boolean) {
  const setStores = useAuthStore((state) => state.setStores);
  const query = useQuery({
    queryKey: ['mobile-stores'],
    queryFn: fetchStores,
    enabled,
  });

  useEffect(() => {
    if (query.data) {
      setStores(query.data);
    }
  }, [query.data, setStores]);

  return query;
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const setStores = useAuthStore((state) => state.setStores);

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await api.post('/api/auth/login', payload);
      const authPayload = unwrapApiData<AuthPayload>(response.data);
      const stores = await fetchStores();
      return { authPayload, stores };
    },
    onSuccess: ({ authPayload, stores }) => {
      setSession(authPayload);
      setStores(stores);
    },
  });
}

export function useAuthState() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const stores = useAuthStore((state) => state.stores);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);

  return useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && accessToken),
      stores,
      activeStoreId,
      activeStore: stores.find((store) => store.id === activeStoreId) ?? null,
    }),
    [accessToken, activeStoreId, stores, user],
  );
}
