import { create } from 'zustand';
import { deleteStoredValue, getStoredJson, setStoredJson } from '../lib/storage';

const CART_STORAGE_KEY = 'gase.mobile.cart.v1';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
}

interface CartStoreState {
  items: CartItem[];
  tableId: string | null;
  tableName: string | null;
  tableSessionId: string | null;
  menuToken: string | null;
  language: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setTable: (payload: {
    tableId: string;
    tableName?: string | null;
    tableSessionId?: string | null;
    menuToken: string;
  }) => void;
  setTableSessionId: (tableSessionId: string | null) => void;
  setLanguage: (language: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  totalAmount: () => number;
  totalItems: () => number;
}

type PersistedCartState = Pick<
  CartStoreState,
  'items' | 'tableId' | 'tableName' | 'tableSessionId' | 'menuToken' | 'language'
>;

function pickPersistedState(state: CartStoreState): PersistedCartState {
  return {
    items: state.items,
    tableId: state.tableId,
    tableName: state.tableName,
    tableSessionId: state.tableSessionId,
    menuToken: state.menuToken,
    language: state.language,
  };
}

async function persistState(state: CartStoreState) {
  await setStoredJson(CART_STORAGE_KEY, pickPersistedState(state));
}

export const useCartStore = create<CartStoreState>((set, get) => ({
  items: [],
  tableId: null,
  tableName: null,
  tableSessionId: null,
  menuToken: null,
  language: 'tr',
  hydrated: false,
  hydrate: async () => {
    const stored = await getStoredJson<PersistedCartState>(CART_STORAGE_KEY);

    set({
      items: stored?.items ?? [],
      tableId: stored?.tableId ?? null,
      tableName: stored?.tableName ?? null,
      tableSessionId: stored?.tableSessionId ?? null,
      menuToken: stored?.menuToken ?? null,
      language: stored?.language ?? 'tr',
      hydrated: true,
    });
  },
  setTable: ({ tableId, tableName, tableSessionId, menuToken }) => {
    set((state) => {
      const nextState = {
        ...state,
        tableId,
        tableName: tableName ?? null,
        tableSessionId: tableSessionId ?? state.tableSessionId,
        menuToken,
      };
      void persistState(nextState);
      return nextState;
    });
  },
  setTableSessionId: (tableSessionId) => {
    set((state) => {
      const nextState = {
        ...state,
        tableSessionId,
      };
      void persistState(nextState);
      return nextState;
    });
  },
  setLanguage: (language) => {
    set((state) => {
      const nextState = {
        ...state,
        language,
      };
      void persistState(nextState);
      return nextState;
    });
  },
  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((entry) => entry.productId === item.productId);
      const nextItems = existing
        ? state.items.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, quantity: entry.quantity + 1, notes: item.notes ?? entry.notes }
              : entry,
          )
        : [...state.items, { ...item, quantity: 1 }];

      const nextState = {
        ...state,
        items: nextItems,
      };
      void persistState(nextState);
      return nextState;
    });
  },
  updateQuantity: (productId, quantity) => {
    set((state) => {
      const nextItems =
        quantity <= 0
          ? state.items.filter((entry) => entry.productId !== productId)
          : state.items.map((entry) =>
              entry.productId === productId ? { ...entry, quantity } : entry,
            );
      const nextState = {
        ...state,
        items: nextItems,
      };
      void persistState(nextState);
      return nextState;
    });
  },
  clearCart: async () => {
    const state = get();
    const nextState = {
      ...state,
      items: [],
    };
    set(nextState);
    await persistState(nextState);
  },
  totalAmount: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  totalItems: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
