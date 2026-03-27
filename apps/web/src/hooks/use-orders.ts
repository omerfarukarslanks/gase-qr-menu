import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'CANCELLED';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderFilters {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  tableId?: string;
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

export function useOrders(storeId: string, filters: OrderFilters = {}) {
  const { page = 1, pageSize = 20, status, tableId, sortBy, sortOrder } = filters;
  const params = new URLSearchParams({
    storeId,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) params.set('status', status);
  if (tableId) params.set('tableId', tableId);
  if (sortBy) params.set('sortBy', sortBy);
  if (sortOrder) params.set('sortOrder', sortOrder);

  return useQuery({
    queryKey: ['orders', storeId, filters],
    queryFn: () =>
      api
        .get<PaginatedResponse<Order>>(`/api/orders?${params}`)
        .then((r) => r.data),
    enabled: !!storeId,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () =>
      api
        .get<{ success: boolean; data: Order }>(`/api/orders/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; status: OrderStatus }) =>
      api
        .patch(`/api/orders/${payload.id}/status`, { status: payload.status })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
