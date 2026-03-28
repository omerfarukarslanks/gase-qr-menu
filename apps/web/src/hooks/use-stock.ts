import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginatedResult } from "@/lib/api-response";

type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
  createdBy?: string;
}

export interface LowStockAlert {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  minStockLevel: number;
  unitAbbreviation: string;
}

interface StockMovementFilters {
  page?: number;
  pageSize?: number;
  ingredientId?: string;
  type?: MovementType;
}

interface StockMovementApiRecord {
  id: string;
  ingredientId: string;
  type: MovementType;
  quantity: number;
  notes?: string;
  createdAt: string;
  ingredient?: {
    name: string;
  };
}

interface LowStockAlertApiRecord {
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  unit?: {
    abbreviation: string;
  } | null;
}

interface CreateStockMovementPayload {
  storeId: string;
  ingredientId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
}

export function useStockMovements(
  storeId: string,
  filters: StockMovementFilters = {}
) {
  const { page = 1, pageSize = 20, ingredientId, type } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });
  if (ingredientId) params.set("ingredientId", ingredientId);
  if (type) params.set("type", type);

  return useQuery({
    queryKey: ["stock-movements", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<StockMovementApiRecord[]>>(
          `/api/stock/movements/store/${storeId}?${params.toString()}`
        )
        .then((response) => ({
          data: (response.data.data ?? []).map((item) => ({
            id: item.id,
            ingredientId: item.ingredientId,
            ingredientName: item.ingredient?.name ?? item.ingredientId,
            type: item.type,
            quantity: item.quantity,
            reason: item.notes,
            createdAt: item.createdAt,
          })),
          meta: response.data.meta ?? {
            total: response.data.data?.length ?? 0,
            page,
            limit: pageSize,
            totalPages: 1,
          },
        }) satisfies PaginatedResult<StockMovement>),
    enabled: !!storeId,
  });
}

export function useLowStockAlerts(storeId: string) {
  return useQuery({
    queryKey: ["stock", "low-alerts", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<LowStockAlertApiRecord[]>>(
          `/api/stock/alerts/store/${storeId}`
        )
        .then((response) =>
          (response.data.data ?? []).map((item) => ({
            ingredientId: item.id,
            ingredientName: item.name,
            currentStock: item.currentStock,
            minStockLevel: item.lowStockThreshold,
            unitAbbreviation: item.unit?.abbreviation ?? "",
          }))
        ),
    enabled: !!storeId,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStockMovementPayload) =>
      api
        .post("/api/stock/movements", {
          ...payload,
          notes: payload.reason,
        })
        .then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stock-movements", variables.storeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["stock", "low-alerts", variables.storeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["ingredients", variables.storeId],
      });
    },
  });
}
