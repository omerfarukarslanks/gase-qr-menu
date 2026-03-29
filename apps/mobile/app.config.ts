import type { ConfigContext, ExpoConfig } from 'expo/config';

function getHost(url?: string) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost' ? null : parsed.hostname;
  } catch {
    return null;
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000';
  const host = getHost(webUrl);

  return {
    ...config,
    name: 'GASE Mobile',
    slug: 'gase-mobile',
    scheme: 'gase',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    assetBundlePatterns: ['**/*'],
    experiments: {
      typedRoutes: true,
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-camera',
        {
          cameraPermission: 'QR menuyu acmak icin kamera izni gerekiyor.',
        },
      ],
      'expo-notifications',
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.gase.mobile',
      associatedDomains: host ? [`applinks:${host}`] : [],
    },
    android: {
      package: 'com.gase.mobile',
      intentFilters: host
        ? [
            {
              action: 'VIEW',
              autoVerify: false,
              data: [
                {
                  scheme: 'https',
                  host,
                  pathPrefix: '/m/',
                },
              ],
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ]
        : [],
    },
    extra: {
      apiUrl,
      webUrl,
      eas: {
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '',
      },
    },
  };
};
