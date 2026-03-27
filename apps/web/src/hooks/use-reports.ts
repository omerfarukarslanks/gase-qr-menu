import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface DailyReport {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderAmount: number;
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  ordersByStatus: Record<string, number>;
}

interface MonthlyReport {
  month: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderAmount: number;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
}

interface ProductAnalytics {
  products: {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    averageRating?: number;
  }[];
}

interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageVisits: number;
  averageSpend: number;
}

export function useDailyReport(storeId: string, date: string) {
  return useQuery({
    queryKey: ['reports', 'daily', storeId, date],
    queryFn: () =>
      api
        .get<{ success: boolean; data: DailyReport }>(
          `/api/reports/daily?storeId=${storeId}&date=${date}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId && !!date,
  });
}

export function useMonthlyReport(storeId: string, month: string) {
  return useQuery({
    queryKey: ['reports', 'monthly', storeId, month],
    queryFn: () =>
      api
        .get<{ success: boolean; data: MonthlyReport }>(
          `/api/reports/monthly?storeId=${storeId}&month=${month}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId && !!month,
  });
}

export function useProductAnalytics(storeId: string) {
  return useQuery({
    queryKey: ['reports', 'products', storeId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: ProductAnalytics }>(
          `/api/reports/products?storeId=${storeId}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId,
  });
}

export function useCustomerAnalytics(storeId: string) {
  return useQuery({
    queryKey: ['reports', 'customers', storeId],
    queryFn: () =>
      api
        .get<{ success: boolean; data: CustomerAnalytics }>(
          `/api/reports/customers?storeId=${storeId}`
        )
        .then((r) => r.data.data),
    enabled: !!storeId,
  });
}
