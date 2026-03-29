"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginatedResult } from "@/lib/api-response";
import {
  appendPaginationParams,
  buildPaginationMeta,
  type AdminPageSize,
} from "@/lib/pagination";

export type PaymentStatus = "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CREDIT_CARD" | "CASH" | "ONLINE";

export interface Payment {
  id: string;
  orderId?: string | null;
  orderNumber?: number | null;
  tableName: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentApiRecord {
  id: string;
  orderId?: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: number;
  } | null;
  tableSession?: {
    tableRef?: {
      name: string;
    } | null;
  } | null;
}

interface PaymentFilters {
  page?: number;
  pageSize?: AdminPageSize;
  status?: PaymentStatus;
  method?: PaymentMethod;
  search?: string;
}

function mapPayment(record: PaymentApiRecord): Payment {
  return {
    id: record.id,
    orderId: record.orderId ?? record.order?.id ?? null,
    orderNumber: record.order?.orderNumber ?? null,
    tableName: record.tableSession?.tableRef?.name ?? "Masa",
    amount: record.amount,
    currency: record.currency ?? "TRY",
    method: record.method,
    status: record.status,
    provider: record.provider,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function usePayments(storeId: string, filters: PaymentFilters = {}) {
  const { page = 1, pageSize = 10, status, method, search } = filters;
  const params = appendPaginationParams(new URLSearchParams(), page, pageSize);

  if (status) {
    params.set("status", status);
  }

  if (method) {
    params.set("method", method);
  }

  if (search) {
    params.set("search", search);
  }

  return useQuery({
    queryKey: ["payments", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<PaymentApiRecord[]>>(
          `/api/payments/store/${storeId}?${params.toString()}`
        )
        .then((response) => ({
          data: (response.data.data ?? []).map(mapPayment),
          meta: buildPaginationMeta(
            response.data.meta,
            response.data.data?.length ?? 0,
            page,
            pageSize
          ),
        }) satisfies PaginatedResult<Payment>),
    enabled: !!storeId,
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) =>
      api.post(`/api/payments/${paymentId}/refund`).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
