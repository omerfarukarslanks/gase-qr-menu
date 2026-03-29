import { create } from 'zustand';
import { deleteStoredValue, getStoredJson, setStoredJson } from '../lib/storage';

const PREFERENCES_STORAGE_KEY = 'gase.mobile.preferences.v1';

export type ThemePreference = 'system' | 'light' | 'dark';

interface PreferencesStoreState {
  themePreference: ThemePreference;
  deviceId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  ensureDeviceId: () => Promise<string>;
  setThemePreference: (themePreference: ThemePreference) => void;
  reset: () => Promise<void>;
}

type PersistedPreferences = Pick<PreferencesStoreState, 'themePreference' | 'deviceId'>;

function pickPersistedState(state: PreferencesStoreState): PersistedPreferences {
  return {
    themePreference: state.themePreference,
    deviceId: state.deviceId,
  };
}

async function persistState(state: PreferencesStoreState) {
  await setStoredJson(PREFERENCES_STORAGE_KEY, pickPersistedState(state));
}

function generateDeviceId() {
  return `gase-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const usePreferencesStore = create<PreferencesStoreState>((set, get) => ({
  themePreference: 'system',
  deviceId: null,
  hydrated: false,
  hydrate: async () => {
    const stored = await getStoredJson<PersistedPreferences>(PREFERENCES_STORAGE_KEY);

    set({
      themePreference: stored?.themePreference ?? 'system',
      deviceId: stored?.deviceId ?? null,
      hydrated: true,
    });
  },
  ensureDeviceId: async () => {
    const current = get().deviceId;

    if (current) {
      return current;
    }

    const deviceId = generateDeviceId();

    set((state) => {
      const nextState = {
        ...state,
        deviceId,
      };
      void persistState(nextState);
      return nextState;
    });

    return deviceId;
  },
  setThemePreference: (themePreference) => {
    set((state) => {
      const nextState = {
        ...state,
        themePreference,
      };
      void persistState(nextState);
      return nextState;
    });
  },
  reset: async () => {
    await deleteStoredValue(PREFERENCES_STORAGE_KEY);
    set({
      themePreference: 'system',
      deviceId: null,
      hydrated: true,
    });
  },
}));
