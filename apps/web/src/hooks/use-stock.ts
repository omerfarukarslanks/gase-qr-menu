import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
  createdBy?: string;
}

interface LowStockAlert {
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

interface CreateStockMovementPayload {
  storeId: string;
  ingredientId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
}

export function useStockMovements(storeId: string, filters: StockMovementFilters = {}) {
  const { page = 1, pageSize = 20, ingredientId, type } = filters;
  const params = new URLSearchParams({
    storeId,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (ingredientId) params.set('ingredientId', ingredientId);
  if (type) params.set('type', type);

  return useQuery({
    queryKey: ['stock-movements', storeId, filters],
    queryFn: () =>
      api
        .get<PaginatedResponse<StockMovement>>(`/api/v1/stock/movements?${params}`)
        .then((r) => r.data),
    enabled: !!storeId,
  });
}

export function useLowStockAlerts(storeId: string) {
  return useQuery({
    queryKey: ['stock', 'low-alerts', storeId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: LowStockAlert[] }>(
          `/api/v1/stock/low-alerts?storeId=${storeId}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStockMovementPayload) =>
      api.post('/api/v1/stock/movements', payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['stock', 'low-alerts', variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ['ingredients', variables.storeId] });
    },
  });
}
