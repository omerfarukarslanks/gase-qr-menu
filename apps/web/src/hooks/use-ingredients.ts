import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginatedResult } from "@/lib/api-response";

export interface Ingredient {
  id: string;
  name: string;
  type: string;
  stockQuantity: number;
  minStockLevel: number;
  currentStock: number;
  lowStockThreshold: number;
  unitId?: string | null;
  unit?: { id: string; name: string; abbreviation: string } | null;
  storeId: string;
  isActive: boolean;
}

interface IngredientFilters {
  page?: number;
  pageSize?: number;
  type?: string;
  search?: string;
}

interface IngredientApiRecord {
  id: string;
  name: string;
  type: string;
  currentStock: number;
  lowStockThreshold: number;
  stockUnitId?: string | null;
  unit?: { id: string; name: string; abbreviation: string } | null;
  storeId: string;
  isActive?: boolean;
}

interface CreateIngredientPayload {
  storeId: string;
  name: string;
  type?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  unitId?: string;
  cost?: number;
}

interface UpdateIngredientPayload {
  id: string;
  name?: string;
  type?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  unitId?: string;
  isActive?: boolean;
  cost?: number;
}

function mapIngredient(item: IngredientApiRecord): Ingredient {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    stockQuantity: item.currentStock,
    minStockLevel: item.lowStockThreshold,
    currentStock: item.currentStock,
    lowStockThreshold: item.lowStockThreshold,
    unitId: item.stockUnitId ?? item.unit?.id ?? null,
    unit: item.unit ?? null,
    storeId: item.storeId,
    isActive: item.isActive ?? true,
  };
}

export function useIngredients(storeId: string, filters: IngredientFilters = {}) {
  const { page = 1, pageSize = 20, type, search } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });

  if (search) {
    params.set("search", search);
  }

  return useQuery({
    queryKey: ["ingredients", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<IngredientApiRecord[]>>(
          `/api/ingredients/store/${storeId}?${params.toString()}`
        )
        .then((response) => {
          const mapped = (response.data.data ?? []).map(mapIngredient);
          const filtered =
            type && type.length > 0
              ? mapped.filter((item) => item.type === type)
              : mapped;

          return {
            data: filtered,
            meta: response.data.meta ?? {
              total: filtered.length,
              page,
              limit: pageSize,
              totalPages: 1,
            },
          } satisfies PaginatedResult<Ingredient>;
        }),
    enabled: !!storeId,
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIngredientPayload) =>
      api
        .post("/api/ingredients", {
          storeId: payload.storeId,
          name: payload.name,
          unitId: payload.unitId,
          currentStock: payload.stockQuantity,
          lowStockThreshold: payload.minStockLevel,
          cost: payload.cost,
          type: payload.type,
        })
        .then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ingredients", variables.storeId],
      });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateIngredientPayload) =>
      api
        .put(`/api/ingredients/${id}`, {
          name: payload.name,
          type: payload.type,
          unitId: payload.unitId,
          currentStock: payload.stockQuantity,
          lowStockThreshold: payload.minStockLevel,
          cost: payload.cost,
          isActive: payload.isActive,
        })
        .then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/ingredients/${id}`).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}
