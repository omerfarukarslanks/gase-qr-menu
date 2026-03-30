import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Fraunces_600SemiBold,
  useFonts as useFraunces,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts as usePlusJakartaFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AppProviders } from '../src/providers/app-providers';
import { useAuthState, useBootstrapState, useSyncStores } from '../src/hooks/use-auth';
import { useAppTheme } from '../src/theme/provider';

function RootNavigator() {
  const router = useRouter();
  const ready = useBootstrapState();
  const { isAuthenticated } = useAuthState();
  const { colors, isDark } = useAppTheme();
  const [plusJakartaLoaded] = usePlusJakartaFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [frauncesLoaded] = useFraunces({
    Fraunces_600SemiBold,
  });

  useSyncStores(ready && isAuthenticated);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;

      if (typeof route === 'string' && route.length > 0) {
        router.push(route as never);
      }
    });

    return () => subscription.remove();
  }, [router]);

  if (!ready || !plusJakartaLoaded || !frauncesLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="scanner" />
        <Stack.Screen name="store" />
        <Stack.Screen name="m/[qrToken]/index" />
        <Stack.Screen name="m/[qrToken]/product/[productId]" />
        <Stack.Screen name="m/[qrToken]/cart" />
        <Stack.Screen name="m/[qrToken]/payment" />
        <Stack.Screen name="m/[qrToken]/result" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
