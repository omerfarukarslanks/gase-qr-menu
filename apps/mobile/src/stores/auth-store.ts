import { create } from 'zustand';
import type { StoreSummary } from '@gase/shared';
import { deleteStoredValue, getStoredJson, setStoredJson } from '../lib/storage';

const AUTH_STORAGE_KEY = 'gase.mobile.auth.v1';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name: string;
  role: string;
  organizationId?: string | null;
}

interface AuthStoreState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  stores: StoreSummary[];
  activeStoreId: string | null;
  hydrated: boolean;
  setSession: (payload: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setStores: (stores: StoreSummary[]) => void;
  setActiveStoreId: (storeId: string | null) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

type PersistedAuthState = Pick<
  AuthStoreState,
  'user' | 'accessToken' | 'refreshToken' | 'stores' | 'activeStoreId'
>;

function pickPersistedState(state: AuthStoreState): PersistedAuthState {
  return {
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    stores: state.stores,
    activeStoreId: state.activeStoreId,
  };
}

async function persistState(state: AuthStoreState) {
  await setStoredJson(AUTH_STORAGE_KEY, pickPersistedState(state));
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  stores: [],
  activeStoreId: null,
  hydrated: false,
  setSession: ({ user, accessToken, refreshToken }) => {
    set((state) => {
      const nextState = {
        ...state,
        user,
        accessToken,
        refreshToken,
      };
      void persistState(nextState);
      return nextState;
    });
  },
  setStores: (stores) => {
    set((state) => {
      const nextState = {
        ...state,
        stores,
        activeStoreId:
          stores.find((store) => store.id === state.activeStoreId)?.id ??
          stores[0]?.id ??
          null,
      };
      void persistState(nextState);
      return nextState;
    });
  },
  setActiveStoreId: (activeStoreId) => {
    set((state) => {
      const nextState = {
        ...state,
        activeStoreId,
      };
      void persistState(nextState);
      return nextState;
    });
  },
  hydrate: async () => {
    const stored = await getStoredJson<PersistedAuthState>(AUTH_STORAGE_KEY);

    set({
      user: stored?.user ?? null,
      accessToken: stored?.accessToken ?? null,
      refreshToken: stored?.refreshToken ?? null,
      stores: stored?.stores ?? [],
      activeStoreId: stored?.activeStoreId ?? null,
      hydrated: true,
    });
  },
  logout: async () => {
    await deleteStoredValue(AUTH_STORAGE_KEY);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      stores: [],
      activeStoreId: null,
      hydrated: true,
    });
  },
}));
