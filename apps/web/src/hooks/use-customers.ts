import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginatedResult } from "@/lib/api-response";

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  visitCount: number;
  totalSpent: number;
  lastVisit?: string;
  createdAt: string;
}

export interface CustomerDetails extends Customer {
  visits: {
    id: string;
    date: string;
    tableId: string;
    tableName: string;
    totalAmount: number;
    orderCount: number;
  }[];
  loyalty?: {
    points: number;
    tier: string;
    totalEarned: number;
    totalRedeemed: number;
  };
}

interface CustomerFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface CustomerVisitRecord {
  id: string;
  visitDate: string;
  totalSpent: number;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

interface CustomerHistoryResponse {
  visits: {
    id: string;
    visitDate: string;
    totalSpent: number;
    createdAt: string;
    store?: { id: string; name: string };
  }[];
  orders?: { id: string; store?: { id: string; name: string } }[];
  loyalty?: {
    points: number;
    totalEarned: number;
    totalSpent: number;
  }[];
  totalVisits: number;
  totalSpent: number;
}

export function useCustomers(storeId: string, filters: CustomerFilters = {}) {
  const { page = 1, pageSize = 20, search } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });

  if (search) {
    params.set("search", search);
  }

  return useQuery({
    queryKey: ["customers", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<CustomerVisitRecord[]>>(
          `/api/customers/store/${storeId}/visits?${params.toString()}`
        )
        .then((response) => {
          const grouped = new Map<string, Customer>();

          for (const visit of response.data.data ?? []) {
            const customer = visit.customer;
            if (!customer) continue;

            const existing = grouped.get(customer.id);
            if (existing) {
              existing.visitCount += 1;
              existing.totalSpent += visit.totalSpent;
              existing.lastVisit =
                existing.lastVisit && existing.lastVisit > visit.visitDate
                  ? existing.lastVisit
                  : visit.visitDate;
            } else {
              grouped.set(customer.id, {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                visitCount: 1,
                totalSpent: visit.totalSpent,
                lastVisit: visit.visitDate,
                createdAt: visit.createdAt,
              });
            }
          }

          const data = Array.from(grouped.values());

          return {
            data,
            meta: response.data.meta ?? {
              total: data.length,
              page,
              limit: pageSize,
              totalPages: 1,
            },
          } satisfies PaginatedResult<Customer>;
        }),
    enabled: !!storeId,
  });
}

export function useCustomerDetails(id: string) {
  return useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: () =>
      api
        .get<ApiResponse<CustomerHistoryResponse>>(`/api/customers/${id}/history`)
        .then((response) => {
          const history = response.data.data;
          const firstVisit = history.visits[0];
          const loyaltyRow = history.loyalty?.[0];

          return {
            id,
            name: firstVisit?.store?.name ? `Musteri ${id.slice(0, 6)}` : `Musteri ${id.slice(0, 6)}`,
            email: undefined,
            phone: undefined,
            visitCount: history.totalVisits,
            totalSpent: history.totalSpent,
            lastVisit: firstVisit?.visitDate,
            createdAt: firstVisit?.createdAt ?? new Date().toISOString(),
            visits: history.visits.map((visit) => ({
              id: visit.id,
              date: visit.visitDate,
              tableId: visit.store?.id ?? "-",
              tableName: visit.store?.name ?? "Bilinmeyen sube",
              totalAmount: visit.totalSpent,
              orderCount: history.orders?.filter(
                (order) => order.store?.id === visit.store?.id
              ).length ?? 0,
            })),
            loyalty: loyaltyRow
              ? {
                  points: loyaltyRow.points,
                  tier:
                    loyaltyRow.points >= 1000
                      ? "Gold"
                      : loyaltyRow.points >= 500
                        ? "Silver"
                        : "Standard",
                  totalEarned: loyaltyRow.totalEarned,
                  totalRedeemed: loyaltyRow.totalSpent,
                }
              : undefined,
          } satisfies CustomerDetails;
        }),
    enabled: !!id,
  });
}
