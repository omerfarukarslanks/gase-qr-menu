import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  storeId: string;
}

interface CreateUnitPayload {
  storeId: string;
  name: string;
  abbreviation: string;
}

interface UpdateUnitPayload {
  id: string;
  name?: string;
  abbreviation?: string;
}

export function useUnits(storeId: string) {
  return useQuery({
    queryKey: ['units', storeId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Unit[] }>(
          `/api/v1/units?storeId=${storeId}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitPayload) =>
      api.post('/api/v1/units', payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units', variables.storeId] });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUnitPayload) =>
      api.patch(`/api/v1/units/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/v1/units/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}
