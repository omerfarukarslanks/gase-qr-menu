import axios from 'axios';
import Constants from 'expo-constants';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth-store';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || extra.apiUrl || 'http://localhost:4000';
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

let refreshPromise: Promise<string | null> | null = null;

function isAuthRequest(url?: string) {
  return AUTH_PATHS.some((path) => url?.includes(path));
}

async function refreshAccessToken() {
  const { refreshToken, user } = useAuthStore.getState();

  if (!refreshToken || !user) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${API_BASE_URL}/api/auth/refresh`,
        {
          refreshToken,
        },
      )
      .then((response) => {
        const nextSession = response.data.data;
        useAuthStore.getState().setSession({
          user,
          accessToken: nextSession.accessToken,
          refreshToken: nextSession.refreshToken,
        });
        return nextSession.accessToken;
      })
      .catch(async () => {
        await useAuthStore.getState().logout();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export function unwrapApiData<T>(payload: ApiResponse<T> | T) {
  if (payload && typeof payload === 'object' && 'success' in (payload as ApiResponse<T>)) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }

  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest(originalRequest.url)
    ) {
      originalRequest._retry = true;
      const nextAccessToken = await refreshAccessToken();

      if (nextAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
