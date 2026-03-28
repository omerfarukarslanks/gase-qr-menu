import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";
import type { AuthSessionPayload } from "@/lib/auth-session";
import { useAuthStore } from "@/lib/store";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  organizationId?: string;
}

type AuthResponse = ApiResponse<AuthSessionPayload>;

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<AuthResponse>("/api/auth/login", payload).then((r) => r.data),
    onSuccess: (data) => {
      setSession(data.data);
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api.post<AuthResponse>("/api/auth/register", payload).then((r) => r.data),
    onSuccess: (data) => {
      setSession(data.data);
    },
  });
}

export function useRefreshToken() {
  const setSession = useAuthStore((state) => state.setSession);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (refreshToken: string) =>
      api
        .post<
          ApiResponse<{
            accessToken: string;
            refreshToken: string;
          }>
        >("/api/auth/refresh", { refreshToken })
        .then((r) => r.data),
    onSuccess: (data) => {
      if (user) {
        setSession({
          user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
        });
      }
    },
  });
}
