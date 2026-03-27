import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Ingredient {
  id: string;
  name: string;
  type: string;
  stockQuantity: number;
  minStockLevel: number;
  unitId: string;
  unit?: { id: string; name: string; abbreviation: string };
  storeId: string;
  isActive: boolean;
}

interface IngredientFilters {
  page?: number;
  pageSize?: number;
  type?: string;
  search?: string;
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

interface CreateIngredientPayload {
  storeId: string;
  name: string;
  type: string;
  stockQuantity?: number;
  minStockLevel?: number;
  unitId?: string;
}

interface UpdateIngredientPayload {
  id: string;
  name?: string;
  type?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  unitId?: string;
  isActive?: boolean;
}

export function useIngredients(storeId: string, filters: IngredientFilters = {}) {
  const { page = 1, pageSize = 20, type, search } = filters;
  const params = new URLSearchParams({
    storeId,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (type) params.set('type', type);
  if (search) params.set('search', search);

  return useQuery({
    queryKey: ['ingredients', storeId, filters],
    queryFn: () =>
      api
        .get<PaginatedResponse<Ingredient>>(`/api/ingredients?${params}`)
        .then((r) => r.data),
    enabled: !!storeId,
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIngredientPayload) =>
      api.post('/api/ingredients', payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ingredients', variables.storeId] });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateIngredientPayload) =>
      api.patch(`/api/ingredients/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/ingredients/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}
