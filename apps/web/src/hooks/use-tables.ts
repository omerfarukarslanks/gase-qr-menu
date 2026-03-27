import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface RestaurantTable {
  id: string;
  name: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'INACTIVE';
  storeId: string;
  currentSession?: {
    id: string;
    startedAt: string;
    guestCount: number;
  };
}

interface CreateTablePayload {
  storeId: string;
  name: string;
  capacity: number;
}

interface UpdateTablePayload {
  id: string;
  name?: string;
  capacity?: number;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'INACTIVE';
}

export function useTables(storeId: string) {
  return useQuery({
    queryKey: ['tables', storeId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: RestaurantTable[] }>(
          `/api/tables?storeId=${storeId}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTablePayload) =>
      api.post('/api/tables', payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tables', variables.storeId] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTablePayload) =>
      api.patch(`/api/tables/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/tables/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useOpenTableSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { tableId: string; guestCount: number }) =>
      api.post(`/api/tables/${payload.tableId}/sessions`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useCloseTableSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { tableId: string; sessionId: string }) =>
      api
        .patch(`/api/tables/${payload.tableId}/sessions/${payload.sessionId}/close`, {})
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}
