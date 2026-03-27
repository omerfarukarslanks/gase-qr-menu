import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  organizationName?: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      api.post<AuthResponse>('/api/auth/login', payload).then((r) => r.data),
    onSuccess: (data) => {
      if (data.data?.accessToken) {
        localStorage.setItem('auth-token', data.data.accessToken);
      }
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api.post<AuthResponse>('/api/auth/register', payload).then((r) => r.data),
    onSuccess: (data) => {
      if (data.data?.accessToken) {
        localStorage.setItem('auth-token', data.data.accessToken);
      }
    },
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: (refreshToken: string) =>
      api
        .post<AuthResponse>('/api/auth/refresh', { refreshToken })
        .then((r) => r.data),
    onSuccess: (data) => {
      if (data.data?.accessToken) {
        localStorage.setItem('auth-token', data.data.accessToken);
      }
    },
  });
}
