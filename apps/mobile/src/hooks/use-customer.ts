import { useMutation, useQuery } from '@tanstack/react-query';
import type { StoreOperatingStatus } from '@gase/shared';
import { api, unwrapApiData } from '../lib/api';

export interface MenuFilters {
  lang?: string;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  excludeAllergens?: string;
  table?: string;
}

export interface PublicAllergen {
  id: string;
  code: string;
  name: string;
  icon?: string;
}

export interface PublicProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  images: { id: string; url: string; order: number }[];
  modelUrl?: string | null;
  allergens: PublicAllergen[];
  ingredients: {
    id: string;
    name: string;
    isRemovable: boolean;
  }[];
  categoryId: string;
  isAvailable: boolean;
  operatingStatus?: StoreOperatingStatus;
}

export interface PublicCategory {
  id: string;
  name: string;
  description?: string | null;
  icon?: string;
  order: number;
  products: PublicProduct[];
}

export interface PublicMenuData {
  id: string;
  name: string;
  slug: string;
  store: {
    id: string;
    name: string;
    logo?: string;
    tableId?: string;
    tableName?: string;
    operatingStatus?: StoreOperatingStatus;
  };
  categories: PublicCategory[];
  allergens: PublicAllergen[];
}

export function usePublicMenu(qrToken: string, filters?: MenuFilters) {
  return useQuery({
    queryKey: ['public-menu', qrToken, filters],
    queryFn: async () => {
      const response = await api.get(`/api/menus/public/by-token/${qrToken}`, {
        params: filters,
      });
      return unwrapApiData<PublicMenuData>(response.data);
    },
    enabled: Boolean(qrToken),
    staleTime: 5 * 60_000,
  });
}

export function usePublicProduct(productId: string, lang?: string) {
  return useQuery({
    queryKey: ['public-product', productId, lang],
    queryFn: async () => {
      const response = await api.get(`/api/menus/public/product/${productId}`, {
        params: { lang },
      });
      return unwrapApiData<PublicProduct>(response.data);
    },
    enabled: Boolean(productId),
    staleTime: 5 * 60_000,
  });
}

export function useEnsurePublicTableSession() {
  return useMutation({
    mutationFn: async (payload: { tableId: string }) => {
      const response = await api.post(`/api/tables/${payload.tableId}/public-session`);
      return unwrapApiData<{ id: string }>(response.data);
    },
  });
}

export function useApplyCoupon(storeId: string) {
  return useMutation({
    mutationFn: async (payload: {
      orderTotal: number;
      couponCode: string;
      items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    }) => {
      const response = await api.post(`/api/campaigns/store/${storeId}/calculate-discount`, payload);
      return unwrapApiData<{
        campaignId?: string;
        campaignName?: string;
        discountAmount?: number;
      }>(response.data);
    },
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (payload: {
      storeId: string;
      tableSessionId: string;
      couponCode?: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        notes?: string;
      }>;
    }) => {
      const response = await api.post('/api/orders', payload);
      return unwrapApiData<{
        id: string;
        totalAmount: number;
        discountAmount: number;
        finalAmount: number;
      }>(response.data);
    },
  });
}

export function useCreateCashPayment() {
  return useMutation({
    mutationFn: async (payload: { orderId: string; amount: number }) => {
      const response = await api.post('/api/payments/cash', payload);
      return unwrapApiData(response.data);
    },
  });
}

export function useInitiateCardPayment() {
  return useMutation({
    mutationFn: async (payload: {
      orderId: string;
      callbackUrl: string;
      cardHolderName: string;
      cardNumber: string;
      expireMonth: string;
      expireYear: string;
      cvc: string;
    }) => {
      const response = await api.post('/api/payments/3d-secure/initiate', payload);
      return unwrapApiData<{ paymentId: string; htmlContent: string }>(response.data);
    },
  });
}

export function useCallWaiter() {
  return useMutation({
    mutationFn: async (payload: { storeId: string; tableId: string; tableName?: string }) => {
      const response = await api.post('/api/notifications/public/call-waiter', payload);
      return unwrapApiData(response.data);
    },
  });
}
