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
