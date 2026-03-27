import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  translations?: { languageCode: string; name: string }[];
}

interface CreateCategoryPayload {
  storeId: string;
  name: string;
  parentId?: string;
  sortOrder?: number;
  translations?: { languageCode: string; name: string }[];
}

interface UpdateCategoryPayload {
  id: string;
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  translations?: { languageCode: string; name: string }[];
}

export function useCategories(storeId: string) {
  return useQuery({
    queryKey: ['categories', storeId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Category[] }>(
          `/api/v1/categories?storeId=${storeId}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId,
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['categories', 'detail', id],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Category }>(`/api/v1/categories/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      api.post('/api/v1/categories', payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.storeId] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCategoryPayload) =>
      api.patch(`/api/v1/categories/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/v1/categories/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
