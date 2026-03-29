import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { api } from './api';
import { usePreferencesStore } from '../stores/preferences-store';
import { useAuthStore } from '../stores/auth-store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerStaffDeviceForPush(storeId?: string | null) {
  const accessToken = useAuthStore.getState().accessToken;

  if (!accessToken) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4f46e5',
    });
  }

  if (!Device.isDevice) {
    return null;
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermissions.status;

  if (finalStatus !== 'granted') {
    const requestPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.easConfig?.projectId ||
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

  if (!projectId) {
    return null;
  }

  const pushToken = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  const deviceId = await usePreferencesStore.getState().ensureDeviceId();

  await api.post('/api/mobile/devices/register', {
    deviceId,
    expoPushToken: pushToken,
    platform: Platform.OS,
    storeId: storeId || undefined,
    appVersion: Application.nativeApplicationVersion ?? Application.applicationName ?? 'dev',
    buildNumber: Application.nativeBuildVersion ?? '1',
  });

  return pushToken;
}

export async function unregisterStaffDeviceFromPush() {
  const accessToken = useAuthStore.getState().accessToken;
  const deviceId = usePreferencesStore.getState().deviceId;

  if (!accessToken || !deviceId) {
    return;
  }

  try {
    await api.delete(`/api/mobile/devices/${deviceId}`);
  } catch {
    // Best-effort logout cleanup.
  }
}
