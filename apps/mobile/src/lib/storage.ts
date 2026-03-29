import * as SecureStore from 'expo-secure-store';

export async function getStoredJson<T>(key: string) {
  const value = await SecureStore.getItemAsync(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function setStoredJson(key: string, value: unknown) {
  await SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function deleteStoredValue(key: string) {
  await SecureStore.deleteItemAsync(key);
}
