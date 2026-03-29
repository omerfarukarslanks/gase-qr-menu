import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginatedResult } from "@/lib/api-response";

export interface ProductTranslation {
  languageCode?: string;
  name: string;
  description?: string | null;
}

export interface ProductIngredient {
  id?: string;
  ingredientId?: string;
  name?: string;
  quantity: number;
  isRemovable?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number;
  categoryId: string;
  unitId?: string;
  category?: { id: string; name: string } | null;
  images: string[];
  coverImage?: string | null;
  model3dUrl?: string | null;
  isActive: boolean;
  storeId: string;
  slug: string;
  currency?: string;
  preparationTime?: number | null;
  allergens?: { id: string; code?: string; name: string }[];
  ingredients?: ProductIngredient[];
  translations?: ProductTranslation[];
}

interface ProductFilters {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface CreateProductPayload {
  storeId: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  categoryId: string;
  unitId?: string;
  slug?: string;
  images?: string[];
  coverImage?: string;
  model3dUrl?: string;
  currency?: string;
  preparationTime?: number;
  isActive?: boolean;
  allergenIds?: string[];
  ingredients?: { ingredientId: string; quantity: number }[];
  translations?: ProductTranslation[];
}

interface UpdateProductPayload {
  id: string;
  name?: string;
  description?: string;
  price?: number;
  costPrice?: number;
  categoryId?: string;
  unitId?: string;
  slug?: string;
  images?: string[];
  coverImage?: string;
  model3dUrl?: string;
  currency?: string;
  preparationTime?: number;
  isActive?: boolean;
  allergenIds?: string[];
  ingredients?: { ingredientId: string; quantity: number }[];
  translations?: ProductTranslation[];
}

export function useProducts(storeId: string, filters: ProductFilters = {}) {
  const {
    page = 1,
    pageSize = 20,
    categoryId,
    search,
    sortBy,
    sortOrder,
  } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });

  if (categoryId) params.set("categoryId", categoryId);
  if (search) params.set("search", search);
  if (sortBy) params.set("sortBy", sortBy);
  if (sortOrder) params.set("sortOrder", sortOrder);

  return useQuery({
    queryKey: ["products", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<Product[]>>(
          `/api/products/store/${storeId}?${params.toString()}`
        )
        .then((response) => ({
          data: response.data.data ?? [],
          meta: response.data.meta ?? {
            total: response.data.data?.length ?? 0,
            page,
            limit: pageSize,
            totalPages: 1,
          },
        }) satisfies PaginatedResult<Product>),
    enabled: !!storeId,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () =>
      api
        .get<ApiResponse<Product>>(`/api/products/${id}`)
        .then((response) => response.data.data),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      api.post("/api/products", payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products", variables.storeId] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProductPayload) =>
      api.put(`/api/products/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/products/${id}`).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
    },
  });
}
