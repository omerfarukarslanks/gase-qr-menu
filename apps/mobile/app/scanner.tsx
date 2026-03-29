import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppButton, AppCard, AppInput, Screen, SectionTitle } from '../src/components/ui';
import { parseMenuLink } from '../src/lib/linking';
import { useAppTheme } from '../src/theme/provider';

export default function ScannerScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualValue, setManualValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [handled, setHandled] = useState(false);

  const handleValue = (value: string) => {
    const parsed = parseMenuLink(value);

    if (!parsed) {
      setErrorMessage('QR icindeki menu baglantisi taninamadi.');
      setHandled(false);
      return;
    }

    setHandled(true);
    router.replace({
      pathname: '/m/[qrToken]',
      params: {
        qrToken: parsed.qrToken,
        table: parsed.tableId || undefined,
      },
    });
  };

  if (!permission) {
    return (
      <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <AppCard>
          <Text style={{ color: colors.foreground }}>Kamera izin durumu yukleniyor...</Text>
        </AppCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionTitle
        eyebrow="QR siparis"
        title="Masa QR kodunu tara."
        description="Mevcut web QR baglantilari aynen calisir; uygulama baglantiyi okuyup dogru menuye acilir."
      />

      {!permission.granted ? (
        <AppCard>
          <Text style={{ color: colors.foreground, lineHeight: 22 }}>
            Hızlı menü açılışı için kamera izni gerekiyor.
          </Text>
          <AppButton onPress={() => requestPermission()}>Kamera Izni Ver</AppButton>
        </AppCard>
      ) : (
        <AppCard style={{ padding: 0, overflow: 'hidden' }}>
          <CameraView
            style={{ height: 360 }}
            onBarcodeScanned={handled ? undefined : ({ data }) => handleValue(data)}
          />
        </AppCard>
      )}

      <AppCard>
        <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
          Manuel baglanti gir
        </Text>
        <AppInput
          placeholder="https://.../m/qr-token?table=..."
          value={manualValue}
          onChangeText={setManualValue}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errorMessage ? <Text style={{ color: '#dc2626', fontSize: 13 }}>{errorMessage}</Text> : null}
        <AppButton onPress={() => handleValue(manualValue)}>Menuyu Ac</AppButton>
      </AppCard>
    </Screen>
  );
}
