import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppButton, AppCard, Screen } from '../../../src/components/ui';
import { useAppTheme } from '../../../src/theme/provider';

export default function OrderResultScreen() {
  const params = useLocalSearchParams<{
    qrToken: string;
    status?: string;
    message?: string;
    amount?: string;
  }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const qrToken = Array.isArray(params.qrToken) ? params.qrToken[0] : params.qrToken;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  const message = Array.isArray(params.message) ? params.message[0] : params.message;
  const amount = Array.isArray(params.amount) ? params.amount[0] : params.amount;
  const success = status === 'success';

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <AppCard
        style={{
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text
          style={{
            color: success ? colors.success : colors.warm,
            fontSize: 32,
            fontFamily: 'Fraunces_600SemiBold',
          }}
        >
          {success ? 'Odeme basarili' : 'Islem tamamlanamadi'}
        </Text>
        <Text style={{ color: colors.mutedForeground, textAlign: 'center', lineHeight: 22 }}>
          {message || (success ? 'Siparisin alinmis durumda. Afiyet olsun.' : 'Lutfen tekrar dene.')}
        </Text>
        {amount ? (
          <Text style={{ color: colors.foreground, fontWeight: '800', fontSize: 18 }}>{amount} TL</Text>
        ) : null}
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
      </AppCard>
    </Screen>
  );
}
