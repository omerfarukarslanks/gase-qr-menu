import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/store";
import type { ApiResponse } from "@/lib/api-response";
import type { AuthSessionPayload } from "@/lib/auth-session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const AUTH_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh"];

let refreshPromise: Promise<string | null> | null = null;

function isAuthRequest(url?: string) {
  return AUTH_PATHS.some((path) => url?.includes(path));
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, user } = useAuthStore.getState();

  if (!refreshToken || !user) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<
        ApiResponse<
          Pick<AuthSessionPayload, "accessToken" | "refreshToken"> & {
            user?: AuthSessionPayload["user"];
          }
        >
      >(`${API_BASE_URL}/api/auth/refresh`, {
        refreshToken,
      })
      .then((response) => {
        const nextData = response.data.data;

        useAuthStore.getState().setSession({
          user: nextData.user ?? user,
          accessToken: nextData.accessToken,
          refreshToken: nextData.refreshToken,
        });

        return nextData.accessToken;
      })
      .catch(() => {
        useAuthStore.getState().logout();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers.Authorization) {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

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

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname + window.location.search;
        const nextParam =
          currentPath && currentPath !== "/login"
            ? `?next=${encodeURIComponent(currentPath)}`
            : "";
        window.location.href = `/login${nextParam}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
