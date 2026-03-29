import { Text, View } from 'react-native';
import { AppCard, EmptyState, Screen, SectionTitle, StatPill } from '../../src/components/ui';
import { useAuthState } from '../../src/hooks/use-auth';
import { useDashboardOverview, useUnreadCount } from '../../src/hooks/use-staff';
import { formatCurrency, formatShortTime } from '../../src/lib/format';
import { useAppTheme } from '../../src/theme/provider';

export default function StoreHomeScreen() {
  const { activeStoreId, activeStore } = useAuthState();
  const { colors } = useAppTheme();
  const { data, isLoading, isError } = useDashboardOverview(activeStoreId ?? '');
  const { data: unreadCount = 0 } = useUnreadCount(activeStoreId ?? '');

  if (!activeStoreId) {
    return (
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <EmptyState
          title="Aktif magaza yok"
          description="Operasyon verilerini gorebilmek icin once bir magaza secilmeli."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle
        eyebrow="Canli operasyon"
        title={activeStore ? `${activeStore.name} icin bugun` : 'Operasyon ozeti'}
        description="Dashboard kartlari yerine dogrudan hareketli kuyruk ve kritik sayilar."
      />

      {isLoading ? (
        <AppCard>
          <Text style={{ color: colors.foreground }}>Operasyon verileri yukleniyor...</Text>
        </AppCard>
      ) : isError || !data ? (
        <EmptyState
          title="Veri alinamadi"
          description="Store ozeti su an okunamiyor. API baglantisini kontrol et."
        />
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatPill label="Yeni siparis" value={String(data.summary.todayOrders)} />
            <StatPill label="Aktif masa" value={`${data.summary.activeTables}`} />
            <StatPill label="Unread" value={String(unreadCount)} />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatPill label="Mutfak kuyrugu" value={String(data.summary.kitchenPending)} />
            <StatPill label="Dusuk stok" value={String(data.summary.lowStockCount)} />
            <StatPill label="Ciro" value={formatCurrency(data.summary.todayRevenue)} />
          </View>

          <AppCard>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>
              Son siparisler
            </Text>
            {data.recentOrders.slice(0, 4).map((order) => (
              <View
                key={order.id}
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 12,
                  gap: 4,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>
                  #{String(order.orderNumber).padStart(3, '0')} • {order.tableName}
                </Text>
                <Text style={{ color: colors.mutedForeground }}>{order.itemSummary}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                  {formatShortTime(order.createdAt)} • {formatCurrency(order.totalAmount)}
                </Text>
              </View>
            ))}
          </AppCard>

          <AppCard>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>
              One cikan urunler
            </Text>
            {data.topProducts.slice(0, 4).map((product) => (
              <View
                key={product.productId}
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 12,
                  gap: 4,
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>
                  {product.productName}
                </Text>
                <Text style={{ color: colors.mutedForeground }}>
                  {product.quantity} adet • {formatCurrency(product.revenue)}
                </Text>
              </View>
            ))}
          </AppCard>
        </>
      )}
    </Screen>
  );
}
