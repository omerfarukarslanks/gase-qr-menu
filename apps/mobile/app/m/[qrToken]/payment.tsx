import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { AppButton, AppCard, AppInput, Screen } from '../../../src/components/ui';
import { useCreateCashPayment, useInitiateCardPayment } from '../../../src/hooks/use-customer';
import { buildWebPaymentCallbackUrl } from '../../../src/lib/linking';
import { formatCurrency } from '../../../src/lib/format';
import { useAppTheme } from '../../../src/theme/provider';

type PaymentMethod = 'CREDIT_CARD' | 'CASH';

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    qrToken: string;
    orderId: string;
    amount: string;
    discount: string;
  }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const cashPayment = useCreateCashPayment();
  const cardPayment = useInitiateCardPayment();
  const qrToken = Array.isArray(params.qrToken) ? params.qrToken[0] : params.qrToken;
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const amount = Number(Array.isArray(params.amount) ? params.amount[0] : params.amount || '0');
  const discount = Number(
    Array.isArray(params.discount) ? params.discount[0] : params.discount || '0',
  );
  const finalAmount = Math.max(0, amount - discount);
  const webUrl =
    process.env.EXPO_PUBLIC_WEB_URL ||
    ((Constants.expoConfig?.extra ?? {}) as { webUrl?: string }).webUrl ||
    'http://localhost:3000';

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expireMonth, setExpireMonth] = useState('');
  const [expireYear, setExpireYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [threeDSHtml, setThreeDSHtml] = useState<string | null>(null);

  const callbackUrl = useMemo(
    () =>
      buildWebPaymentCallbackUrl({
        qrToken,
        orderId,
        amount,
        discount,
        webUrl,
      }),
    [amount, discount, orderId, qrToken, webUrl],
  );

  if (threeDSHtml) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, gap: 12 }}>
          <AppButton variant="ghost" onPress={() => setThreeDSHtml(null)}>
            Geri Don
          </AppButton>
          <View style={{ flex: 1, overflow: 'hidden', borderRadius: 24 }}>
            <WebView
              originWhitelist={['*']}
              source={{ html: threeDSHtml, baseUrl: webUrl }}
              onNavigationStateChange={(navigationState) => {
                if (!navigationState.url.includes(`/m/${qrToken}/payment?status=`)) {
                  return;
                }

                try {
                  const url = new URL(navigationState.url);
                  const status = url.searchParams.get('status') || 'failure';
                  const message = url.searchParams.get('message') || 'Odeme tamamlanamadi.';

                  setThreeDSHtml(null);
                  router.replace({
                    pathname: '/m/[qrToken]/result',
                    params: {
                      qrToken,
                      status,
                      message,
                      amount: String(finalAmount),
                    },
                  });
                } catch {
                  // Ignore malformed navigation urls.
                }
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppButton variant="ghost" onPress={() => router.back()}>
        Sepete Don
      </AppButton>

      <AppCard>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 30,
            fontFamily: 'Fraunces_600SemiBold',
          }}
        >
          Odeme
        </Text>
        <Text style={{ color: colors.mutedForeground }}>
          Guvenli 3D Secure veya masada nakit tahsilat.
        </Text>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.mutedForeground }}>Ara toplam</Text>
            <Text style={{ color: colors.foreground }}>{formatCurrency(amount)}</Text>
          </View>
          {discount > 0 ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.success }}>Indirim</Text>
              <Text style={{ color: colors.success }}>-{formatCurrency(discount)}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 18 }}>Toplam</Text>
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 18 }}>
              {formatCurrency(finalAmount)}
            </Text>
          </View>
        </View>
      </AppCard>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <AppButton
            variant={method === 'CREDIT_CARD' ? 'primary' : 'secondary'}
            onPress={() => setMethod('CREDIT_CARD')}
          >
            Kart
          </AppButton>
        </View>
        <View style={{ flex: 1 }}>
          <AppButton
            variant={method === 'CASH' ? 'primary' : 'secondary'}
            onPress={() => setMethod('CASH')}
          >
            Nakit
          </AppButton>
        </View>
      </View>

      {method === 'CREDIT_CARD' ? (
        <AppCard>
          <AppInput
            placeholder="Kart üzerindeki isim"
            value={cardHolderName}
            onChangeText={setCardHolderName}
          />
          <AppInput
            placeholder="Kart numarasi"
            value={cardNumber}
            onChangeText={(value) =>
              setCardNumber(
                value
                  .replace(/\D/g, '')
                  .slice(0, 16)
                  .replace(/(.{4})/g, '$1 ')
                  .trim(),
              )
            }
            keyboardType="number-pad"
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AppInput
                placeholder="AA"
                value={expireMonth}
                onChangeText={(value) => setExpireMonth(value.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                placeholder="YY"
                value={expireYear}
                onChangeText={(value) => setExpireYear(value.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput
                placeholder="CVC"
                value={cvc}
                onChangeText={(value) => setCvc(value.replace(/\D/g, '').slice(0, 3))}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {errorMessage ? <Text style={{ color: '#dc2626', fontSize: 13 }}>{errorMessage}</Text> : null}

          <AppButton
            loading={cardPayment.isPending}
            onPress={() =>
              cardPayment.mutate(
                {
                  orderId,
                  callbackUrl,
                  cardHolderName,
                  cardNumber: cardNumber.replace(/\s/g, ''),
                  expireMonth,
                  expireYear,
                  cvc,
                },
                {
                  onSuccess: (result) => {
                    setThreeDSHtml(result.htmlContent);
                  },
                  onError: (error: any) => {
                    setErrorMessage(
                      error?.response?.data?.message || 'Kart odemesi baslatilamadi.',
                    );
                  },
                },
              )
            }
          >
            3D Secure Ile Ode
          </AppButton>
        </AppCard>
      ) : null}

      {method === 'CASH' ? (
        <AppCard>
          <Text style={{ color: colors.foreground, lineHeight: 22 }}>
            Nakit odeme secildiginde siparis odemesi masada tamamlanmis olarak isaretlenir.
          </Text>
          {errorMessage ? <Text style={{ color: '#dc2626', fontSize: 13 }}>{errorMessage}</Text> : null}
          <AppButton
            loading={cashPayment.isPending}
            onPress={() =>
              cashPayment.mutate(
                {
                  orderId,
                  amount: finalAmount,
                },
                {
                  onSuccess: () => {
                    router.replace({
                      pathname: '/m/[qrToken]/result',
                      params: {
                        qrToken,
                        status: 'success',
                        message: 'Nakit odeme kaydi alindi.',
                        amount: String(finalAmount),
                      },
                    });
                  },
                  onError: (error: any) => {
                    setErrorMessage(
                      error?.response?.data?.message || 'Nakit odeme tamamlanamadi.',
                    );
                  },
                },
              )
            }
          >
            Nakit Odemeyi Onayla
          </AppButton>
        </AppCard>
      ) : null}
    </Screen>
  );
}
