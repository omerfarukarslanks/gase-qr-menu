import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category?: { id: string; name: string };
  images: string[];
  model3dUrl?: string;
  isActive: boolean;
  storeId: string;
  allergens?: { id: string; name: string }[];
  ingredients?: { id: string; name: string; quantity: number }[];
  translations?: { languageCode: string; name: string; description: string }[];
}

interface ProductFilters {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

interface CreateProductPayload {
  storeId: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  allergenIds?: string[];
  ingredients?: { ingredientId: string; quantity: number }[];
  translations?: { languageCode: string; name: string; description: string }[];
}

interface UpdateProductPayload {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isActive?: boolean;
  allergenIds?: string[];
  ingredients?: { ingredientId: string; quantity: number }[];
  translations?: { languageCode: string; name: string; description: string }[];
}

export function useProducts(storeId: string, filters: ProductFilters = {}) {
  const { page = 1, pageSize = 20, categoryId, search, sortBy, sortOrder } = filters;
  const params = new URLSearchParams({
    storeId,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (categoryId) params.set('categoryId', categoryId);
  if (search) params.set('search', search);
  if (sortBy) params.set('sortBy', sortBy);
  if (sortOrder) params.set('sortOrder', sortOrder);

  return useQuery({
    queryKey: ['products', storeId, filters],
    queryFn: () =>
      api
        .get<PaginatedResponse<Product>>(`/api/products?${params}`)
        .then((r) => r.data),
    enabled: !!storeId,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Product }>(`/api/products/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      api.post('/api/products', payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', variables.storeId] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProductPayload) =>
      api.patch(`/api/products/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/products/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
