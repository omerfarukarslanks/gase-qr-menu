import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StoreSummary } from '@gase/shared';
import { api, unwrapApiData } from '../lib/api';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'CANCELLED';

export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'OUT_OF_SERVICE';

export interface DashboardOverview {
  summary: {
    todayOrders: number;
    todayRevenue: number;
    activeTables: number;
    totalTables: number;
    activeProducts: number;
    kitchenPending: number;
    totalCustomers: number;
    weeklyGrowthPercent: number;
    lowStockCount: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: number;
    status: string;
    createdAt: string;
    tableName: string;
    customerName?: string | null;
    takenByName: string;
    totalAmount: number;
    itemSummary: string;
    itemCount: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
    orderCount: number;
    imageUrl?: string | null;
  }>;
  live: {
    updatedAt: string;
  };
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  storeId: string;
  tableId?: string | null;
  tableName: string;
  customerName?: string | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
    status?: OrderItemStatus;
  }>;
  totalAmount: number;
  finalAmount?: number;
  takenById?: string | null;
  takenByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  section?: string | null;
  status: TableStatus;
  storeId: string;
  currentSession?: {
    id: string;
    openedAt: string;
    customerName?: string | null;
    customerPhone?: string | null;
    orderCount: number;
    assignedStaff?: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface KitchenBuckets {
  pending: Order[];
  confirmed: Order[];
  preparing: Order[];
  ready: Order[];
  total: number;
}

export interface StaffNotification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  tableId?: string | null;
  data?: Record<string, unknown>;
}

export function useStores(enabled: boolean) {
  return useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await api.get('/api/stores');
      return unwrapApiData<StoreSummary[]>(response.data);
    },
    enabled,
  });
}

export function useDashboardOverview(storeId: string) {
  return useQuery({
    queryKey: ['staff-dashboard', storeId],
    queryFn: async () => {
      const response = await api.get(`/api/dashboard/store/${storeId}`);
      return unwrapApiData<DashboardOverview>(response.data);
    },
    enabled: Boolean(storeId),
  });
}

export function useOrders(storeId: string, status?: OrderStatus | 'ALL') {
  return useQuery({
    queryKey: ['staff-orders', storeId, status],
    queryFn: async () => {
      const response = await api.get(`/api/orders/store/${storeId}`, {
        params: status && status !== 'ALL' ? { status } : undefined,
      });
      return unwrapApiData<Order[]>(response.data);
    },
    enabled: Boolean(storeId),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; status: OrderStatus }) => {
      const response = await api.put(`/api/orders/${payload.id}/status`, {
        status: payload.status,
      });
      return unwrapApiData<Order>(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['staff-kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['staff-tables'] });
    },
  });
}

export function useTables(storeId: string) {
  return useQuery({
    queryKey: ['staff-tables', storeId],
    queryFn: async () => {
      const response = await api.get(`/api/tables/store/${storeId}`);
      return unwrapApiData<RestaurantTable[]>(response.data);
    },
    enabled: Boolean(storeId),
  });
}

export function useOpenTableSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      tableId: string;
      customerName?: string;
      customerPhone?: string;
      assignedStaffUserId?: string;
    }) => {
      const response = await api.post(`/api/tables/${payload.tableId}/open-session`, payload);
      return unwrapApiData(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tables'] });
    },
  });
}

export function useCloseTableSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { sessionId: string }) => {
      const response = await api.post(`/api/tables/sessions/${payload.sessionId}/close`);
      return unwrapApiData(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tables'] });
    },
  });
}

export function useKitchenOrders(storeId: string) {
  return useQuery({
    queryKey: ['staff-kitchen', storeId],
    queryFn: async () => {
      const response = await api.get(`/api/kitchen/store/${storeId}/orders`);
      return unwrapApiData<KitchenBuckets>(response.data);
    },
    enabled: Boolean(storeId),
  });
}

export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { orderItemId: string; status: OrderItemStatus }) => {
      const response = await api.put(`/api/kitchen/items/${payload.orderItemId}/status`, {
        status: payload.status,
      });
      return unwrapApiData(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-kitchen'] });
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
    },
  });
}

export function useNotifications(storeId: string, unreadOnly = false) {
  return useQuery({
    queryKey: ['staff-notifications', storeId, unreadOnly],
    queryFn: async () => {
      const response = await api.get(`/api/notifications/store/${storeId}`, {
        params: unreadOnly ? { unreadOnly: true } : undefined,
      });
      return unwrapApiData<StaffNotification[]>(response.data);
    },
    enabled: Boolean(storeId),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount(storeId: string) {
  return useQuery({
    queryKey: ['staff-notifications', 'unread-count', storeId],
    queryFn: async () => {
      const response = await api.get(`/api/notifications/store/${storeId}/unread-count`);
      return unwrapApiData<{ count: number }>(response.data).count;
    },
    enabled: Boolean(storeId),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/api/notifications/${id}/read`);
      return unwrapApiData(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storeId: string) => {
      const response = await api.put(`/api/notifications/store/${storeId}/read-all`);
      return unwrapApiData(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}
