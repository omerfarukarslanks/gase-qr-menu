import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export interface CategoryTranslation {
  languageCode?: string;
  name: string;
  description?: string | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  storeId: string;
  parentId: string | null;
  slug: string;
  image?: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  translations?: CategoryTranslation[];
}

interface CreateCategoryPayload {
  storeId: string;
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
  slug?: string;
  sortOrder?: number;
  translations?: CategoryTranslation[];
}

interface UpdateCategoryPayload {
  id: string;
  name?: string;
  description?: string;
  parentId?: string | null;
  image?: string;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
  translations?: CategoryTranslation[];
}

export function useCategories(storeId: string) {
  return useQuery({
    queryKey: ["categories", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<Category[]>>(`/api/categories/store/${storeId}`)
        .then((response) => response.data.data ?? []),
    enabled: !!storeId,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["categories", "detail", id],
    queryFn: () =>
      api
        .get<ApiResponse<Category>>(`/api/categories/${id}`)
        .then((response) => response.data.data),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      api.post("/api/categories", payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["categories", variables.storeId],
      });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCategoryPayload) =>
      api.put(`/api/categories/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"], exact: false });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/categories/${id}`).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"], exact: false });
    },
  });
}
