import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  visitCount: number;
  totalSpent: number;
  lastVisit?: string;
  createdAt: string;
}

interface CustomerDetails extends Customer {
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

export function useCustomers(storeId: string, filters: CustomerFilters = {}) {
  const { page = 1, pageSize = 20, search } = filters;
  const params = new URLSearchParams({
    storeId,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set('search', search);

  return useQuery({
    queryKey: ['customers', storeId, filters],
    queryFn: () =>
      api
        .get<PaginatedResponse<Customer>>(`/api/v1/customers?${params}`)
        .then((r) => r.data),
    enabled: !!storeId,
  });
}

export function useCustomerDetails(id: string) {
  return useQuery({
    queryKey: ['customers', 'detail', id],
    queryFn: () =>
      api
        .get<{ success: boolean; data: CustomerDetails }>(`/api/v1/customers/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });
}
