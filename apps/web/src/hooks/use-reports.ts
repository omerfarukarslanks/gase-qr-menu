import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export interface ReportPeriod {
  startDate: string;
  endDate: string;
}

export interface ReportOverview {
  period: ReportPeriod;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderAmount: number;
    totalCustomers: number;
  };
  series: {
    revenueByDay: Array<{
      date: string;
      label: string;
      revenue: number;
      orders: number;
    }>;
  };
  breakdown: {
    ordersByStatus: Array<{
      status: string;
      count: number;
    }>;
    paymentMethods: Array<{
      method: string;
      count: number;
      amount: number;
    }>;
  };
}

export interface ProductAnalyticsReport {
  period: ReportPeriod;
  summary: {
    totalProducts: number;
    totalQuantity: number;
    totalRevenue: number;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
    orderCount: number;
    imageUrl?: string | null;
  }>;
}

export interface CustomerAnalyticsReport {
  period: ReportPeriod;
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageVisits: number;
    averageSpend: number;
  };
  items: Array<{
    customerId: string;
    customerName: string;
    email?: string | null;
    visitDate: string;
    totalSpent: number;
  }>;
}

export interface StaffAnalyticsReport {
  period: ReportPeriod;
  summary: {
    trackedOrders: number;
    unassignedOrders: number;
    totalRevenue: number;
  };
  items: Array<{
    staffUserId: string | null;
    staffName: string;
    role: string;
    orderCount: number;
    revenue: number;
    averageOrderValue: number;
  }>;
}

function buildRangeParams(startDate: string, endDate: string) {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  return params.toString();
}

export function useReportOverview(storeId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "overview", storeId, startDate, endDate],
    queryFn: () =>
      api
        .get<ApiResponse<ReportOverview>>(
          `/api/reports/overview/${storeId}?${buildRangeParams(startDate, endDate)}`
        )
        .then((response) => response.data.data),
    enabled: !!storeId && !!startDate && !!endDate,
  });
}

export function useDailyReport(storeId: string, date: string) {
  return useQuery({
    queryKey: ["reports", "daily", storeId, date],
    queryFn: () =>
      api
        .get<ApiResponse<ReportOverview>>(`/api/reports/daily/${storeId}/${date}`)
        .then((response) => response.data.data),
    enabled: !!storeId && !!date,
  });
}

export function useMonthlyReport(storeId: string, month: string) {
  return useQuery({
    queryKey: ["reports", "monthly", storeId, month],
    queryFn: () => {
      const [year, monthValue] = month.split("-");

      return api
        .get<ApiResponse<ReportOverview>>(
          `/api/reports/monthly/${storeId}/${year}/${monthValue}`
        )
        .then((response) => response.data.data);
    },
    enabled: !!storeId && !!month,
  });
}

export function useProductAnalytics(storeId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "products", storeId, startDate, endDate],
    queryFn: () =>
      api
        .get<ApiResponse<ProductAnalyticsReport>>(
          `/api/reports/products/${storeId}?${buildRangeParams(startDate, endDate)}`
        )
        .then((response) => response.data.data),
    enabled: !!storeId && !!startDate && !!endDate,
  });
}

export function useCustomerAnalytics(storeId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "customers", storeId, startDate, endDate],
    queryFn: () =>
      api
        .get<ApiResponse<CustomerAnalyticsReport>>(
          `/api/reports/customers/${storeId}?${buildRangeParams(startDate, endDate)}`
        )
        .then((response) => response.data.data),
    enabled: !!storeId && !!startDate && !!endDate,
  });
}

export function useStaffAnalytics(storeId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["reports", "staff", storeId, startDate, endDate],
    queryFn: () =>
      api
        .get<ApiResponse<StaffAnalyticsReport>>(
          `/api/reports/staff/${storeId}?${buildRangeParams(startDate, endDate)}`
        )
        .then((response) => response.data.data),
    enabled: !!storeId && !!startDate && !!endDate,
  });
}
