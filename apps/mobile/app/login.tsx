import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton, AppCard, AppInput, Screen, SectionTitle } from '../src/components/ui';
import { useAuthState, useLogin } from '../src/hooks/use-auth';
import { useAppTheme } from '../src/theme/provider';

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message !== 'undefined'
  ) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response
      ?.data?.message;

    return Array.isArray(message) ? message.join(', ') : message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Giris yapilamadi.';
}

export default function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const { isAuthenticated } = useAuthState();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/store');
    }
  }, [isAuthenticated, router]);

  const errorMessage = useMemo(() => getErrorMessage(loginMutation.error), [loginMutation.error]);

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={{ gap: 18 }}>
        <SectionTitle
          eyebrow="Magaza operasyonu"
          title="Ekip oturumunu ac."
          description="Siparis, masa ve mutfak akislarini role gore sade bir yuzeyde yonet."
        />

        <AppCard>
          <View style={{ gap: 12 }}>
            <AppInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput
              secureTextEntry
              placeholder="Sifre"
              value={password}
              onChangeText={setPassword}
            />

            {errorMessage ? (
              <Text style={{ color: '#dc2626', fontSize: 13 }}>{errorMessage}</Text>
            ) : null}

            <AppButton
              loading={loginMutation.isPending}
              onPress={() =>
                loginMutation.mutate(
                  {
                    email,
                    password,
                  },
                  {
                    onSuccess: () => {
                      router.replace('/store');
                    },
                  },
                )
              }
            >
              Giris Yap
            </AppButton>

            <AppButton variant="ghost" onPress={() => router.back()}>
              Geri Don
            </AppButton>
          </View>
        </AppCard>

        <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20 }}>
          Owner, manager, waiter ve kitchen rollerine gore sekmeler mobilde otomatik sadeleşir.
        </Text>
      </View>
    </Screen>
  );
}
