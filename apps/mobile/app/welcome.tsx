import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AppButton, AppCard, Screen, SectionTitle } from '../src/components/ui';
import { useAuthState } from '../src/hooks/use-auth';
import { useAppTheme } from '../src/theme/provider';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthState();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/store');
    }
  }, [isAuthenticated, router]);

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
      <View style={{ gap: 18 }}>
        <SectionTitle
          eyebrow="GASE mobile"
          title="QR okut, menuyu ac, siparisi hizla ilerlet."
          description="Ayni uygulama icinde misafir siparis akisi ve saha operasyonu birlikte calisir."
        />

        <AppCard
          style={{
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
          }}
        >
          <Text style={{ color: colors.secondaryForeground, fontSize: 15, lineHeight: 24 }}>
            Müşteri için akış tarama odaklı, mağaza için akış kuyruk odaklı çalışır. Bu yüzden ilk
            ekranda sadece iki net giriş bırakıyoruz.
          </Text>
        </AppCard>
      </View>

      <View style={{ gap: 12 }}>
        <AppButton onPress={() => router.push('/scanner')}>QR Tara</AppButton>
        <AppButton variant="secondary" onPress={() => router.push('/login')}>
          Magaza Girisi
        </AppButton>
      </View>
    </Screen>
  );
}
