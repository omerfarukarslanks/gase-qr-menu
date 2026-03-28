import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export interface Unit {
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
    queryKey: ["units", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<Unit[]>>(`/api/units/store/${storeId}`)
        .then((response) => response.data.data ?? []),
    enabled: !!storeId,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUnitPayload) =>
      api.post("/api/units", payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["units", variables.storeId] });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUnitPayload) =>
      api.put(`/api/units/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/units/${id}`).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}
