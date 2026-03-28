import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

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
  description?: string;
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
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  operatingStatus?: {
    isStoreActive: boolean;
    isPubliclyVisible: boolean;
    hasSchedule: boolean;
    isOpenNow: boolean;
    acceptingOrders: boolean;
    currentDay: string;
    currentDayLabel: string;
    openTime?: string | null;
    closeTime?: string | null;
    timezone: string;
    message: string;
  };
}

export interface PublicCategory {
  id: string;
  name: string;
  description?: string;
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
    operatingStatus?: {
      isStoreActive: boolean;
      isPubliclyVisible: boolean;
      hasSchedule: boolean;
      isOpenNow: boolean;
      acceptingOrders: boolean;
      currentDay: string;
      currentDayLabel: string;
      openTime?: string | null;
      closeTime?: string | null;
      timezone: string;
      message: string;
    };
  };
  categories: PublicCategory[];
  allergens: PublicAllergen[];
}

export function usePublicMenu(qrToken: string, filters?: MenuFilters) {
  return useQuery<PublicMenuData>({
    queryKey: ["public-menu", qrToken, filters],
    queryFn: () =>
      api
        .get(`/api/menus/public/by-token/${qrToken}`, { params: filters })
        .then((r) => r.data.data ?? r.data),
    enabled: !!qrToken,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicProduct(productId: string, lang?: string) {
  return useQuery<PublicProduct>({
    queryKey: ["public-product", productId, lang],
    queryFn: () =>
      api
        .get(`/api/menus/public/product/${productId}`, {
          params: { lang },
        })
        .then((r) => r.data.data ?? r.data),
    enabled: !!productId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}
