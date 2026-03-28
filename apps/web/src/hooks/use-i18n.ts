import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export interface StoreLanguage {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

interface AddStoreLanguagePayload {
  storeId: string;
  languageCode: string;
  name: string;
  isDefault?: boolean;
}

interface RemoveStoreLanguagePayload {
  storeId: string;
  languageCode: string;
}

interface SetDefaultLanguagePayload {
  storeId: string;
  languageCode: string;
}

export function useStoreLanguages(storeId: string) {
  return useQuery({
    queryKey: ["i18n", "store-languages", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<StoreLanguage[]>>(`/api/i18n/store/${storeId}/languages`)
        .then((response) => response.data.data ?? []),
    enabled: !!storeId,
  });
}

export function useAddStoreLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, ...payload }: AddStoreLanguagePayload) =>
      api
        .post<ApiResponse<StoreLanguage>>(`/api/i18n/store/${storeId}/languages`, payload)
        .then((response) => response.data.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["i18n", "store-languages", variables.storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", "detail", variables.storeId] });
    },
  });
}

export function useRemoveStoreLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, languageCode }: RemoveStoreLanguagePayload) =>
      api.delete(`/api/i18n/store/${storeId}/languages/${languageCode}`).then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["i18n", "store-languages", variables.storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["stores", "detail", variables.storeId] });
    },
  });
}

export function useSetDefaultStoreLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, languageCode }: SetDefaultLanguagePayload) =>
      api
        .put<ApiResponse<{ id: string; defaultLanguage: string }>>(
          `/api/i18n/store/${storeId}/languages/${languageCode}/default`
        )
        .then((response) => response.data.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["i18n", "store-languages", variables.storeId],
      });
      queryClient.invalidateQueries({ queryKey: ["stores", "detail", variables.storeId] });
    },
  });
}
