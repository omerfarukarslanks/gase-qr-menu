import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton, AppCard, AppInput, EmptyState, Screen } from '../../../src/components/ui';
import {
  useApplyCoupon,
  useCallWaiter,
  useCreateOrder,
  useEnsurePublicTableSession,
  usePublicMenu,
} from '../../../src/hooks/use-customer';
import { useCartStore } from '../../../src/stores/cart-store';
import { formatCurrency } from '../../../src/lib/format';
import { useAppTheme } from '../../../src/theme/provider';

export default function CartScreen() {
  const params = useLocalSearchParams<{ qrToken: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const qrToken = Array.isArray(params.qrToken) ? params.qrToken[0] : params.qrToken;
  const items = useCartStore((state) => state.items);
  const tableId = useCartStore((state) => state.tableId);
  const tableNameFromStore = useCartStore((state) => state.tableName);
  const tableSessionId = useCartStore((state) => state.tableSessionId);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalAmount = useCartStore((state) => state.totalAmount());
  const setTableSessionId = useCartStore((state) => state.setTableSessionId);
  const language = useCartStore((state) => state.language);
  const { data: menuData } = usePublicMenu(qrToken, {
    table: tableId || undefined,
    lang: language,
  });
  const ensureSession = useEnsurePublicTableSession();
  const createOrder = useCreateOrder();
  const callWaiter = useCallWaiter();
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{
    discount: number;
    name: string;
  } | null>(null);
  const applyCoupon = useApplyCoupon(menuData?.store.id ?? '');

  const subtotal = totalAmount;
  const discount = couponApplied?.discount ?? 0;
  const grandTotal = Math.max(0, subtotal - discount);
  const tableName = menuData?.store.tableName ?? tableNameFromStore ?? 'Masa';
  const operatingStatus = menuData?.store.operatingStatus;

  const isOrderingBlocked = !tableId || (operatingStatus ? !operatingStatus.acceptingOrders : false);

  const orderItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.notes,
      })),
    [items],
  );

  if (items.length === 0) {
    return (
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <EmptyState
          title="Sepetin bos"
          description="Urün ekleyerek siparişe başlayabilirsin."
          action={
            <AppButton
              onPress={() =>
                router.replace({
                  pathname: '/m/[qrToken]',
                  params: { qrToken },
                })
              }
            >
              Menuye Don
            </AppButton>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppButton variant="ghost" onPress={() => router.back()}>
        Menuye Don
      </AppButton>

      <AppCard>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 28,
            fontFamily: 'Fraunces_600SemiBold',
          }}
        >
          Sepetim
        </Text>
        <Text style={{ color: colors.mutedForeground }}>
          {tableId ? `${tableName} icin siparis hazirlaniyor.` : 'Masa bilgisi olmadan siparis olusturulamaz.'}
        </Text>
      </AppCard>

      <View style={{ gap: 12 }}>
        {items.map((item) => (
          <AppCard key={item.productId}>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>{item.name}</Text>
            <Text style={{ color: colors.primary, fontWeight: '800' }}>{formatCurrency(item.price)}</Text>
            {item.notes ? <Text style={{ color: colors.mutedForeground }}>{item.notes}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <AppButton variant="secondary" style={{ minHeight: 38, width: 44 }} onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                  -
                </AppButton>
                <View style={{ minWidth: 32, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.foreground, fontWeight: '800' }}>{item.quantity}</Text>
                </View>
                <AppButton variant="secondary" style={{ minHeight: 38, width: 44 }} onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                  +
                </AppButton>
              </View>
              <Text style={{ color: colors.foreground, fontWeight: '800' }}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          </AppCard>
        ))}
      </View>

      <AppCard>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>Kupon</Text>
        <AppInput placeholder="Kupon kodu" value={couponCode} onChangeText={setCouponCode} />
        <AppButton
          variant="secondary"
          loading={applyCoupon.isPending}
          onPress={() =>
            applyCoupon.mutate(
              {
                orderTotal: subtotal,
                couponCode,
                items: orderItems.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
              },
              {
                onSuccess: (result) => {
                  if (result?.campaignId) {
                    setCouponApplied({
                      discount: Math.round((result.discountAmount ?? 0) * 100) / 100,
                      name: result.campaignName ?? 'Kupon indirimi',
                    });
                  } else {
                    setCouponApplied(null);
                  }
                },
              },
            )
          }
        >
          Kuponu Uygula
        </AppButton>
        {couponApplied ? (
          <Text style={{ color: colors.success, fontWeight: '700' }}>
            {couponApplied.name}: -{formatCurrency(couponApplied.discount)}
          </Text>
        ) : null}
      </AppCard>

      <AppCard>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.mutedForeground }}>Ara toplam</Text>
            <Text style={{ color: colors.foreground }}>{formatCurrency(subtotal)}</Text>
          </View>
          {discount > 0 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.success }}>Indirim</Text>
              <Text style={{ color: colors.success }}>-{formatCurrency(discount)}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '800' }}>Toplam</Text>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '800' }}>
              {formatCurrency(grandTotal)}
            </Text>
          </View>
        </View>
      </AppCard>

      {!tableId ? (
        <AppCard
          style={{
            backgroundColor: colors.warmSurface,
            borderColor: colors.warmSurface,
          }}
        >
          <Text style={{ color: colors.warm, fontWeight: '700' }}>
            Siparis icin menuyu masa QR kodu ile acman gerekiyor.
          </Text>
        </AppCard>
      ) : null}

      {operatingStatus && !operatingStatus.acceptingOrders ? (
        <AppCard
          style={{
            backgroundColor: colors.warmSurface,
            borderColor: colors.warmSurface,
          }}
        >
          <Text style={{ color: colors.warm, fontWeight: '700' }}>{operatingStatus.message}</Text>
        </AppCard>
      ) : null}

      <AppButton
        variant="secondary"
        loading={callWaiter.isPending}
        onPress={() => {
          if (!menuData?.store.id || !tableId) {
            return;
          }

          callWaiter.mutate({
            storeId: menuData.store.id,
            tableId,
            tableName,
          });
        }}
      >
        Garson Cagir
      </AppButton>

      <AppButton
        loading={createOrder.isPending || ensureSession.isPending}
        disabled={isOrderingBlocked}
        onPress={async () => {
          if (!menuData?.store.id || !tableId) {
            return;
          }

          const resolvedSessionId =
            tableSessionId ||
            (await ensureSession.mutateAsync({
              tableId,
            })).id;

          setTableSessionId(resolvedSessionId);

          const order = await createOrder.mutateAsync({
            storeId: menuData.store.id,
            tableSessionId: resolvedSessionId,
            couponCode: couponApplied ? couponCode : undefined,
            items: orderItems,
          });

          await clearCart();

          router.push({
            pathname: '/m/[qrToken]/payment',
            params: {
              qrToken,
              orderId: order.id,
              amount: String(order.totalAmount),
              discount: String(order.discountAmount ?? discount),
            },
          });
        }}
      >
        Odemeye Gec
      </AppButton>
    </Screen>
  );
}
