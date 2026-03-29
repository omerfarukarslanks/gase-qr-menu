import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAuthState } from '../../src/hooks/use-auth';
import { useStaffPushRegistration } from '../../src/hooks/use-staff-push';
import { useStoreRealtime } from '../../src/hooks/use-store-realtime';
import { useUnreadCount } from '../../src/hooks/use-staff';
import { getEffectiveStaffRole, canAccessTab } from '../../src/lib/staff-access';
import { useAppTheme } from '../../src/theme/provider';

export default function StoreLayout() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { isAuthenticated, activeStore, activeStoreId, user } = useAuthState();
  const effectiveRole = getEffectiveStaffRole(user?.role, activeStore?.role);
  const { data: unreadCount = 0 } = useUnreadCount(activeStoreId ?? '');

  useStoreRealtime(activeStoreId);
  useStaffPushRegistration(activeStoreId, isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ops', href: '/store' }} />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Siparisler',
          href: canAccessTab('orders', effectiveRole) ? '/store/orders' : null,
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Masalar',
          href: canAccessTab('tables', effectiveRole) ? '/store/tables' : null,
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: 'Mutfak',
          href: canAccessTab('kitchen', effectiveRole) ? '/store/kitchen' : null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Daha Fazla',
          href: '/store/more',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
