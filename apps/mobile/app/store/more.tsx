import { useMemo, useRef } from 'react';
import { Linking, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { AppButton, AppCard, AppChip, Screen, SectionTitle } from '../../src/components/ui';
import { useAuthState } from '../../src/hooks/use-auth';
import { useNotifications } from '../../src/hooks/use-staff';
import { unregisterStaffDeviceFromPush } from '../../src/lib/push';
import { useAuthStore } from '../../src/stores/auth-store';
import { usePreferencesStore } from '../../src/stores/preferences-store';
import { useAppTheme } from '../../src/theme/provider';

export default function StoreMoreScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const logout = useAuthStore((state) => state.logout);
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId);
  const { activeStore, activeStoreId, stores, user } = useAuthState();
  const themePreference = usePreferencesStore((state) => state.themePreference);
  const setThemePreference = usePreferencesStore((state) => state.setThemePreference);
  const { data: unreadNotifications = [] } = useNotifications(activeStoreId ?? '', true);
  const webUrl =
    process.env.EXPO_PUBLIC_WEB_URL ||
    ((Constants.expoConfig?.extra ?? {}) as { webUrl?: string }).webUrl ||
    'http://localhost:3000';

  const themeOptions = useMemo(
    () =>
      [
        { key: 'system', label: 'Sistem' },
        { key: 'light', label: 'Acik' },
        { key: 'dark', label: 'Koyu' },
      ] as const,
    [],
  );

  return (
    <>
      <Screen>
        <SectionTitle
          eyebrow="Daha fazla"
          title="Magaza baglami ve kisayollar."
          description="Sahada gereken ayarlar, tema tercihi ve web admin kacis yolu burada."
        />

        <AppCard>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>
            {activeStore?.name || 'Magaza secilmedi'}
          </Text>
          <Text style={{ color: colors.mutedForeground }}>
            {user?.name} • {activeStore?.role || user?.role}
          </Text>
          <AppButton variant="secondary" onPress={() => bottomSheetRef.current?.present()}>
            Magaza Degistir
          </AppButton>
        </AppCard>

        <AppCard>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>Tema</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {themeOptions.map((option) => (
              <AppChip
                key={option.key}
                label={option.label}
                active={themePreference === option.key}
                onPress={() => setThemePreference(option.key)}
              />
            ))}
          </View>
        </AppCard>

        <AppCard>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>Bildirimler</Text>
          {unreadNotifications.slice(0, 3).map((notification) => (
            <View
              key={notification.id}
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 10,
                gap: 4,
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: '700' }}>{notification.type}</Text>
              <Text style={{ color: colors.mutedForeground }}>{notification.message}</Text>
            </View>
          ))}
          <AppButton variant="secondary" onPress={() => router.push('/store/notifications')}>
            Tum Bildirimleri Ac
          </AppButton>
        </AppCard>

        <AppButton variant="secondary" onPress={() => Linking.openURL(`${webUrl}/admin`)}>
          Web Admini Ac
        </AppButton>
        <AppButton
          variant="ghost"
          onPress={async () => {
            await unregisterStaffDeviceFromPush();
            await logout();
            router.replace('/welcome');
          }}
        >
          Cikis Yap
        </AppButton>
      </Screen>

      <BottomSheetModal ref={bottomSheetRef} snapPoints={['45%']} backgroundStyle={{ backgroundColor: colors.card }}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>Magaza Sec</Text>
          {stores.map((store) => (
            <AppButton
              key={store.id}
              variant={activeStoreId === store.id ? 'primary' : 'secondary'}
              onPress={() => {
                setActiveStoreId(store.id);
                bottomSheetRef.current?.dismiss();
              }}
            >
              {store.name}
            </AppButton>
          ))}
        </View>
      </BottomSheetModal>
    </>
  );
}
