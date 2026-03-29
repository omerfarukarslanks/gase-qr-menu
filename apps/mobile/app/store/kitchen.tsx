import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton, AppCard, AppChip, EmptyState, Screen, SectionTitle } from '../../src/components/ui';
import {
  type Order,
  type OrderItemStatus,
  type OrderStatus,
  useKitchenOrders,
  useUpdateOrderItemStatus,
  useUpdateOrderStatus,
} from '../../src/hooks/use-staff';
import { useAuthState } from '../../src/hooks/use-auth';
import { formatShortTime } from '../../src/lib/format';
import { useAppTheme } from '../../src/theme/provider';

type KitchenColumn = 'pending' | 'preparing' | 'ready';

function getNextKitchenAction(status: OrderStatus) {
  if (status === 'PENDING') return { next: 'CONFIRMED' as const, label: 'Onayla' };
  if (status === 'CONFIRMED') return { next: 'PREPARING' as const, label: 'Basla' };
  if (status === 'PREPARING') return { next: 'READY' as const, label: 'Hazir' };
  if (status === 'READY') return { next: 'SERVED' as const, label: 'Servise Gonder' };
  return null;
}

function getNextItemStatus(status?: OrderItemStatus) {
  if (status === 'PENDING') return 'PREPARING' as const;
  if (status === 'PREPARING') return 'READY' as const;
  return null;
}

function KitchenOrderCard({
  order,
  onAdvanceOrder,
  onAdvanceItem,
}: {
  order: Order;
  onAdvanceOrder: () => void;
  onAdvanceItem: (itemId: string, status: OrderItemStatus) => void;
}) {
  const { colors } = useAppTheme();
  const action = getNextKitchenAction(order.status);

  return (
    <AppCard>
      <View style={{ gap: 4 }}>
        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '800' }}>
          #{String(order.orderNumber).padStart(3, '0')} • {order.tableName}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
          {formatShortTime(order.createdAt)} • {order.status}
        </Text>
      </View>

      {order.items.map((item) => {
        const nextStatus = getNextItemStatus(item.status);

        return (
          <View
            key={item.id}
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 10,
              gap: 6,
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: '700' }}>
              {item.quantity}x {item.productName}
            </Text>
            {item.notes ? <Text style={{ color: colors.mutedForeground }}>{item.notes}</Text> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.mutedForeground }}>{item.status || 'PENDING'}</Text>
              {nextStatus ? (
                <AppButton
                  variant="secondary"
                  style={{ minHeight: 36, paddingHorizontal: 14 }}
                  onPress={() => onAdvanceItem(item.id, nextStatus)}
                >
                  {nextStatus}
                </AppButton>
              ) : null}
            </View>
          </View>
        );
      })}

      {action ? <AppButton onPress={onAdvanceOrder}>{action.label}</AppButton> : null}
    </AppCard>
  );
}

export default function StoreKitchenScreen() {
  const { activeStoreId } = useAuthState();
  const [column, setColumn] = useState<KitchenColumn>('pending');
  const { data, isLoading, isError } = useKitchenOrders(activeStoreId ?? '');
  const updateOrderStatus = useUpdateOrderStatus();
  const updateOrderItemStatus = useUpdateOrderItemStatus();

  const orders = useMemo(() => {
    if (!data) {
      return [];
    }

    if (column === 'pending') {
      return [...data.pending, ...data.confirmed];
    }

    if (column === 'preparing') {
      return data.preparing;
    }

    return data.ready;
  }, [column, data]);

  return (
    <Screen>
      <SectionTitle
        eyebrow="Mutfak"
        title="Tek kolonlu hizli is akisi."
        description="Mobilde yatay board yerine secilebilir kuyruk kolonlari daha hizli okunur."
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <AppChip label={`Bekleyen (${data ? data.pending.length + data.confirmed.length : 0})`} active={column === 'pending'} onPress={() => setColumn('pending')} />
        <AppChip label={`Hazirlaniyor (${data?.preparing.length ?? 0})`} active={column === 'preparing'} onPress={() => setColumn('preparing')} />
        <AppChip label={`Hazir (${data?.ready.length ?? 0})`} active={column === 'ready'} onPress={() => setColumn('ready')} />
      </View>

      {isLoading ? (
        <AppCard>
          <Text>Mutfak kuyrugu yukleniyor...</Text>
        </AppCard>
      ) : isError ? (
        <EmptyState title="Mutfak listesi alinamadi" description="Aktif siparisler okunamadi." />
      ) : orders.length === 0 ? (
        <EmptyState title="Kuyruk bos" description="Bu kolonda aktif siparis yok." />
      ) : (
        orders.map((order) => (
          <KitchenOrderCard
            key={order.id}
            order={order}
            onAdvanceOrder={() => {
              const action = getNextKitchenAction(order.status);
              if (!action) return;

              updateOrderStatus.mutate({
                id: order.id,
                status: action.next,
              });
            }}
            onAdvanceItem={(itemId, status) =>
              updateOrderItemStatus.mutate({
                orderItemId: itemId,
                status,
              })
            }
          />
        ))
      )}
    </Screen>
  );
}
