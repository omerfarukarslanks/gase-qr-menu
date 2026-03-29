import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginatedResult } from "@/lib/api-response";

export type OrderStatus =
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "CANCELLED";

export type OrderItemStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  status?: OrderItemStatus;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  storeId: string;
  tableId?: string | null;
  tableName: string;
  customerName?: string | null;
  items: OrderItem[];
  totalAmount: number;
  finalAmount?: number;
  takenById?: string | null;
  takenByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderApiRecord {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  storeId: string;
  totalAmount: number;
  finalAmount?: number;
  createdAt: string;
  updatedAt: string;
  tableSession?: {
    customerName?: string | null;
    assignedStaff?: {
      id: string;
      name: string;
    } | null;
    tableRef?: {
      id: string;
      name: string;
    } | null;
  } | null;
  takenBy?: {
    id: string;
    name: string;
  } | null;
  items?: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string | null;
    product?: {
      slug?: string | null;
      translations?: { name?: string | null }[];
    } | null;
  }[];
}

interface OrderFilters {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
}

interface KitchenBucketsApi {
  pending: OrderApiRecord[];
  confirmed: OrderApiRecord[];
  preparing: OrderApiRecord[];
  ready: OrderApiRecord[];
  total: number;
}

export interface KitchenBuckets {
  pending: Order[];
  confirmed: Order[];
  preparing: Order[];
  ready: Order[];
  total: number;
}

function mapOrder(record: OrderApiRecord): Order {
  return {
    id: record.id,
    orderNumber: record.orderNumber,
    status: record.status,
    storeId: record.storeId,
    tableId: record.tableSession?.tableRef?.id ?? null,
    tableName: record.tableSession?.tableRef?.name ?? "Masa",
    customerName: record.tableSession?.customerName ?? null,
    items:
      record.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName:
          item.product?.translations?.[0]?.name ?? item.product?.slug ?? "Urun",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes ?? undefined,
        status: (item as any).status as OrderItemStatus | undefined,
      })) ?? [],
    totalAmount: record.totalAmount,
    finalAmount: record.finalAmount,
    takenById: record.takenBy?.id ?? record.tableSession?.assignedStaff?.id ?? null,
    takenByName: record.takenBy?.name ?? record.tableSession?.assignedStaff?.name ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function useOrders(storeId: string, filters: OrderFilters = {}) {
  const { page = 1, pageSize = 20, status } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });

  if (status) {
    params.set("status", status);
  }

  return useQuery({
    queryKey: ["orders", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<OrderApiRecord[]>>(
          `/api/orders/store/${storeId}?${params.toString()}`
        )
        .then((response) => ({
          data: (response.data.data ?? []).map(mapOrder),
          meta: response.data.meta ?? {
            total: response.data.data?.length ?? 0,
            page,
            limit: pageSize,
            totalPages: 1,
          },
        }) satisfies PaginatedResult<Order>),
    enabled: !!storeId,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () =>
      api
        .get<ApiResponse<OrderApiRecord>>(`/api/orders/${id}`)
        .then((response) => mapOrder(response.data.data)),
    enabled: !!id,
  });
}

export function useKitchenOrders(storeId: string) {
  return useQuery({
    queryKey: ["kitchen-orders", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<KitchenBucketsApi>>(`/api/kitchen/store/${storeId}/orders`)
        .then((response) => {
          const payload = response.data.data;

          return {
            pending: (payload?.pending ?? []).map(mapOrder),
            confirmed: (payload?.confirmed ?? []).map(mapOrder),
            preparing: (payload?.preparing ?? []).map(mapOrder),
            ready: (payload?.ready ?? []).map(mapOrder),
            total: payload?.total ?? 0,
          } satisfies KitchenBuckets;
        }),
    enabled: !!storeId,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { id: string; status: OrderStatus }) =>
      api.put(`/api/orders/${payload.id}/status`, { status: payload.status }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
    },
  });
}

export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { orderItemId: string; status: OrderItemStatus }) =>
      api
        .put(`/api/kitchen/items/${payload.orderItemId}/status`, {
          status: payload.status,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
