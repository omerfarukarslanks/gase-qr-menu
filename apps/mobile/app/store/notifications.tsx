import { Text, View } from 'react-native';
import { AppButton, AppCard, EmptyState, Screen, SectionTitle } from '../../src/components/ui';
import { useAuthState } from '../../src/hooks/use-auth';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../src/hooks/use-staff';
import { formatShortDate, formatShortTime } from '../../src/lib/format';
import { useAppTheme } from '../../src/theme/provider';

export default function StoreNotificationsScreen() {
  const { activeStoreId } = useAuthState();
  const { colors } = useAppTheme();
  const { data = [], isLoading, isError } = useNotifications(activeStoreId ?? '');
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <Screen>
      <SectionTitle
        eyebrow="Bildirimler"
        title="Unread ve son olaylar."
        description="Waiter call, yeni siparis ve store eventleri ayni listede toplanir."
      />

      {activeStoreId ? (
        <AppButton variant="secondary" loading={markAll.isPending} onPress={() => markAll.mutate(activeStoreId)}>
          Tumunu Okundu Yap
        </AppButton>
      ) : null}

      {isLoading ? (
        <AppCard>
          <Text style={{ color: colors.foreground }}>Bildirimler yukleniyor...</Text>
        </AppCard>
      ) : isError ? (
        <EmptyState title="Bildirim listesi alinamadi" description="Store notification feed okunamiyor." />
      ) : data.length === 0 ? (
        <EmptyState title="Bildirim yok" description="Henuz okunacak bir olay gorunmuyor." />
      ) : (
        data.map((notification) => (
          <AppCard key={notification.id}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.foreground, fontWeight: '800' }}>{notification.type}</Text>
              <Text style={{ color: colors.mutedForeground }}>{notification.message}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                {formatShortDate(notification.createdAt)} • {formatShortTime(notification.createdAt)}
              </Text>
            </View>
            {!notification.isRead ? (
              <AppButton
                variant="secondary"
                loading={markOne.isPending}
                onPress={() => markOne.mutate(notification.id)}
              >
                Okundu Yap
              </AppButton>
            ) : null}
          </AppCard>
        ))
      )}
    </Screen>
  );
}
