import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthState } from '../src/hooks/use-auth';
import { useAppTheme } from '../src/theme/provider';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthState();
  const { colors } = useAppTheme();

  useEffect(() => {
    router.replace(isAuthenticated ? '/store' : '/welcome');
  }, [isAuthenticated, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
