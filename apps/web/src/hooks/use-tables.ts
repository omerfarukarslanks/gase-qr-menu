import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export type TableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "OUT_OF_SERVICE";

export interface TableSessionSummary {
  id: string;
  openedAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  orderCount: number;
}

export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  capacity: number;
  section?: string | null;
  status: TableStatus;
  storeId: string;
  currentSession?: TableSessionSummary | null;
}

interface TableApiRecord {
  id: string;
  number: number;
  name: string;
  capacity: number;
  section?: string | null;
  status: TableStatus;
  storeId: string;
  sessions?: {
    id: string;
    openedAt: string;
    customerName?: string | null;
    customerPhone?: string | null;
    orders?: { id: string }[];
  }[];
}

interface CreateTablePayload {
  storeId: string;
  number: number;
  name: string;
  capacity: number;
  section?: string;
}

interface UpdateTablePayload {
  id: string;
  name?: string;
  capacity?: number;
  section?: string;
  status?: TableStatus;
}

function mapTable(record: TableApiRecord): RestaurantTable {
  const currentSession = record.sessions?.[0];

  return {
    id: record.id,
    number: record.number,
    name: record.name,
    capacity: record.capacity,
    section: record.section ?? null,
    status: record.status,
    storeId: record.storeId,
    currentSession: currentSession
      ? {
          id: currentSession.id,
          openedAt: currentSession.openedAt,
          customerName: currentSession.customerName ?? null,
          customerPhone: currentSession.customerPhone ?? null,
          orderCount: currentSession.orders?.length ?? 0,
        }
      : null,
  };
}

export function useTables(storeId: string) {
  return useQuery({
    queryKey: ["tables", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<TableApiRecord[]>>(`/api/tables/store/${storeId}`)
        .then((r) => (r.data.data ?? []).map(mapTable)),
    enabled: !!storeId,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTablePayload) =>
      api.post("/api/tables", payload).then((r) => r.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tables", variables.storeId] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTablePayload) =>
      api.put(`/api/tables/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/tables/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useOpenTableSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableId, customerName, customerPhone }: { tableId: string; customerName?: string; customerPhone?: string }) =>
      api
        .post(`/api/tables/${tableId}/open-session`, {
          customerName,
          customerPhone,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useCloseTableSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { sessionId: string }) =>
      api.post(`/api/tables/sessions/${payload.sessionId}/close`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function useEnsurePublicTableSession() {
  return useMutation({
    mutationFn: (payload: { tableId: string }) =>
      api.post<ApiResponse<{ id: string }>>(`/api/tables/${payload.tableId}/public-session`).then((r) => r.data.data),
  });
}
