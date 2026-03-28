import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export interface DashboardRecentOrder {
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
}

export interface DashboardTopProduct {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  orderCount: number;
  imageUrl?: string | null;
}

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
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  live: {
    updatedAt: string;
  };
}

export function useDashboardOverview(storeId: string) {
  return useQuery({
    queryKey: ["dashboard", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<DashboardOverview>>(`/api/dashboard/store/${storeId}`)
        .then((response) => response.data.data),
    enabled: !!storeId,
  });
}
