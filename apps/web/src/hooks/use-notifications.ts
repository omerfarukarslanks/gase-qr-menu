import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  storeId: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface NotificationFilters {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function useNotifications(storeId: string, filters: NotificationFilters = {}) {
  const { page = 1, pageSize = 20, isRead } = filters;
  const params = new URLSearchParams({
    storeId,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (isRead !== undefined) params.set('isRead', String(isRead));

  return useQuery({
    queryKey: ['notifications', storeId, filters],
    queryFn: () =>
      api
        .get<PaginatedResponse<Notification>>(`/api/v1/notifications?${params}`)
        .then((r) => r.data),
    enabled: !!storeId,
  });
}

export function useUnreadCount(storeId: string) {
  return useQuery({
    queryKey: ['notifications', 'unread-count', storeId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: { count: number } }>(
          `/api/v1/notifications/unread-count?storeId=${storeId}`
        )
        .then((r) => r.data.data.count),
    enabled: !!storeId,
    refetchInterval: 30000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/v1/notifications/${id}/read`, {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storeId: string) =>
      api.patch(`/api/v1/notifications/read-all?storeId=${storeId}`, {}).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
