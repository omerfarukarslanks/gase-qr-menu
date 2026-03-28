import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiMeta, ApiResponse } from "@/lib/api-response";
import type { StoreSummary } from "@/lib/auth-session";

interface StoreListResponse extends ApiResponse<StoreSummary[]> {
  meta?: ApiMeta;
}

interface CreateStorePayload {
  organizationId: string;
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  coverImage?: string;
  currency?: string;
  timezone?: string;
}

interface UpdateStorePayload {
  id: string;
  name?: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  coverImage?: string;
  currency?: string;
  timezone?: string;
  isActive?: boolean;
  settings?: Record<string, unknown>;
}

export interface StoreDetail extends StoreSummary {
  organizationId?: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  defaultLanguage?: string | null;
  settings?: Record<string, unknown> | null;
}

export function useStores(enabled = true) {
  return useQuery({
    queryKey: ["stores"],
    queryFn: () =>
      api.get<StoreListResponse>("/api/stores").then((response) => ({
        data: response.data.data ?? [],
        meta: response.data.meta,
      })),
    enabled,
  });
}

export function useStore(id: string) {
  return useQuery({
    queryKey: ["stores", "detail", id],
    queryFn: () =>
      api
        .get<ApiResponse<StoreDetail>>(`/api/stores/${id}`)
        .then((response) => response.data.data),
    enabled: !!id,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStorePayload) =>
      api
        .post<ApiResponse<StoreSummary>>("/api/stores", payload)
        .then((response) => response.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateStorePayload) =>
      api
        .put<ApiResponse<StoreDetail>>(`/api/stores/${id}`, payload)
        .then((response) => response.data.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", "detail", variables.id] });
    },
  });
}
