import { useMemo, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { AppButton, AppCard, AppChip, EmptyState, Screen, SectionTitle } from '../../src/components/ui';
import { useAuthState } from '../../src/hooks/use-auth';
import { type Order, type OrderStatus, useOrders, useUpdateOrderStatus } from '../../src/hooks/use-staff';
import { formatCurrency, formatShortTime } from '../../src/lib/format';
import { useAppTheme } from '../../src/theme/provider';

type FilterStatus = 'ALL' | Exclude<OrderStatus, 'DRAFT' | 'CANCELLED'>;

const nextStatusAction: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  PENDING: { next: 'CONFIRMED', label: 'Onayla' },
  CONFIRMED: { next: 'PREPARING', label: 'Hazirla' },
  PREPARING: { next: 'READY', label: 'Hazir' },
  READY: { next: 'SERVED', label: 'Servis Et' },
};

export default function StoreOrdersScreen() {
  const { activeStoreId } = useAuthState();
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { data = [], isLoading, isError } = useOrders(activeStoreId ?? '', filter);
  const updateStatus = useUpdateOrderStatus();

  const orders = useMemo(
    () =>
      [...data].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [data],
  );

  return (
    <>
      <Screen>
        <SectionTitle
          eyebrow="Siparis akisi"
          title="Filtreli kuyruk ve hizli durum gecisleri."
          description="Kart yığını yerine aksiyon öncelikli satırlar ve açılır detay."
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'] as FilterStatus[]).map(
            (status) => (
              <AppChip
                key={status}
                label={status === 'ALL' ? 'Tumu' : status}
                active={filter === status}
                onPress={() => setFilter(status)}
              />
            ),
          )}
        </View>

        {isLoading ? (
          <AppCard>
            <Text style={{ color: colors.foreground }}>Siparisler yukleniyor...</Text>
          </AppCard>
        ) : isError ? (
          <EmptyState title="Siparisler alinamadi" description="Operasyon listesi su an okunamiyor." />
        ) : orders.length === 0 ? (
          <EmptyState title="Siparis yok" description="Bu filtrede aktif siparis gorunmuyor." />
        ) : (
          orders.map((order) => {
            const action = nextStatusAction[order.status];
            return (
              <AppCard key={order.id}>
                <View style={{ gap: 6 }}>
                  <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '800' }}>
                    #{String(order.orderNumber).padStart(3, '0')} • {order.tableName}
                  </Text>
                  <Text style={{ color: colors.mutedForeground }}>
                    {order.items.map((item) => `${item.quantity}x ${item.productName}`).join(', ')}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {formatShortTime(order.createdAt)} • {order.status}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <AppButton variant="secondary" onPress={() => setSelectedOrder(order)}>
                      Detay
                    </AppButton>
                  </View>
                  {action ? (
                    <View style={{ flex: 1 }}>
                      <AppButton
                        loading={updateStatus.isPending}
                        onPress={() =>
                          updateStatus.mutate({
                            id: order.id,
                            status: action.next,
                          })
                        }
                      >
                        {action.label}
                      </AppButton>
                    </View>
                  ) : null}
                </View>
              </AppCard>
            );
          })
        )}
      </Screen>

      <Modal visible={Boolean(selectedOrder)} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.42)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              gap: 14,
              maxHeight: '75%',
            }}
          >
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '800' }}>
              {selectedOrder
                ? `#${String(selectedOrder.orderNumber).padStart(3, '0')} • ${selectedOrder.tableName}`
                : ''}
            </Text>
            {selectedOrder?.items.map((item) => (
              <AppCard key={item.id}>
                <Text style={{ color: colors.foreground, fontWeight: '700' }}>
                  {item.quantity}x {item.productName}
                </Text>
                {item.notes ? <Text style={{ color: colors.mutedForeground }}>{item.notes}</Text> : null}
                <Text style={{ color: colors.primary, fontWeight: '800' }}>
                  {formatCurrency(item.totalPrice)}
                </Text>
              </AppCard>
            ))}
            {selectedOrder ? (
              <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 18 }}>
                Toplam: {formatCurrency(selectedOrder.finalAmount ?? selectedOrder.totalAmount)}
              </Text>
            ) : null}
            <AppButton variant="secondary" onPress={() => setSelectedOrder(null)}>
              Kapat
            </AppButton>
          </View>
        </View>
      </Modal>
    </>
  );
}
