import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { MOBILE_THEME } from '@gase/shared';
import { usePreferencesStore } from '../stores/preferences-store';

type ThemeMode = 'light' | 'dark';
type ThemePreference = 'system' | 'light' | 'dark';
type ThemeColors = (typeof MOBILE_THEME.colors)[keyof typeof MOBILE_THEME.colors];

type AppThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  preference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = usePreferencesStore((state) => state.themePreference);
  const setThemePreference = usePreferencesStore((state) => state.setThemePreference);

  const mode: ThemeMode =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      colors: MOBILE_THEME.colors[mode],
      preference,
      setThemePreference,
    }),
    [mode, preference, setThemePreference],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
}
