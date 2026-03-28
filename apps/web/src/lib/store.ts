"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AuthSessionPayload,
  AuthUser,
  StoreSummary,
} from "@/lib/auth-session";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  stores: StoreSummary[];
  activeStoreId: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setSession: (payload: AuthSessionPayload) => void;
  updateUser: (payload: Partial<AuthUser>) => void;
  setStores: (stores: StoreSummary[]) => void;
  setActiveStoreId: (storeId: string | null) => void;
  logout: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      stores: [],
      activeStoreId: null,
      isAuthenticated: false,
      hasHydrated: false,
      setSession: ({ user, accessToken, refreshToken }) => {
        set((state) => ({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          hasHydrated: true,
          activeStoreId: state.activeStoreId,
        }));
      },
      updateUser: (payload) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...payload } : state.user,
        })),
      setStores: (stores) =>
        set((state) => ({
          stores,
          activeStoreId:
            stores.find((store) => store.id === state.activeStoreId)?.id ??
            stores[0]?.id ??
            null,
        })),
      setActiveStoreId: (activeStoreId) => set({ activeStoreId }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          stores: [],
          activeStoreId: null,
          isAuthenticated: false,
          hasHydrated: true,
        }),
      markHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "auth-storage",
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        stores: state.stores,
        activeStoreId: state.activeStoreId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image?: string;
}

interface CartState {
  items: CartItem[];
  tableId: string | null;
  menuSlug: string | null;
  setTable: (tableId: string, menuSlug: string) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      menuSlug: null,
      setTable: (tableId, menuSlug) => set({ tableId, menuSlug }),
      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] });
        }
      },
      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
        } else {
          set({
            items: get().items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      totalAmount: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
