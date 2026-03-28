import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api-response";

export interface MenuProduct {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder?: number;
  products?: MenuProduct[];
}

export interface MenuSummary {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  storeId: string;
  qrToken: string;
  qrCodeUrl?: string | null;
  categoryIds: string[];
  categoryCount: number;
  productCount: number;
  categories: MenuCategory[];
  createdAt?: string;
}

export interface MenuDetail extends MenuSummary {}

interface MenuApiRecord {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  storeId: string;
  qrToken: string;
  qrCodeUrl?: string | null;
  createdAt?: string;
  menuCategories?: {
    sortOrder?: number;
    isActive?: boolean;
    category: {
      id: string;
      slug?: string;
      sortOrder?: number;
      translations?: { name: string }[];
      products?: {
        id: string;
        slug?: string;
        isActive: boolean;
        salePrice?: number;
        sortOrder?: number;
        translations?: { name: string }[];
      }[];
    };
  }[];
}

interface CreateMenuPayload {
  storeId: string;
  name: string;
  description?: string;
  categoryIds?: string[];
}

interface UpdateMenuPayload {
  id: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  categoryIds?: string[];
}

function mapMenuCategory(record: NonNullable<MenuApiRecord["menuCategories"]>[number]) {
  return {
    id: record.category.id,
    name: record.category.translations?.[0]?.name ?? record.category.slug ?? "Kategori",
    isActive: record.isActive ?? true,
    sortOrder: record.sortOrder ?? record.category.sortOrder ?? 0,
    products:
      record.category.products?.map((product) => ({
        id: product.id,
        name: product.translations?.[0]?.name ?? product.slug ?? "Urun",
        price: product.salePrice ?? 0,
        isActive: product.isActive,
        sortOrder: product.sortOrder ?? 0,
      })) ?? [],
  };
}

function mapMenu(record: MenuApiRecord): MenuSummary {
  const categories = (record.menuCategories ?? []).map(mapMenuCategory);

  return {
    id: record.id,
    name: record.name,
    description: record.description ?? null,
    isActive: record.isActive,
    storeId: record.storeId,
    qrToken: record.qrToken,
    qrCodeUrl: record.qrCodeUrl ?? null,
    categoryIds: categories.map((category) => category.id),
    categoryCount: categories.length,
    productCount: categories.reduce(
      (total, category) => total + (category.products?.length ?? 0),
      0
    ),
    categories,
    createdAt: record.createdAt,
  };
}

export function useMenus(storeId: string) {
  return useQuery({
    queryKey: ["menus", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<MenuApiRecord[]>>(`/api/menus/store/${storeId}`)
        .then((response) => (response.data.data ?? []).map(mapMenu)),
    enabled: !!storeId,
  });
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: ["menus", "detail", id],
    queryFn: () =>
      api
        .get<ApiResponse<MenuApiRecord>>(`/api/menus/${id}`)
        .then((response) => mapMenu(response.data.data)),
    enabled: !!id,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMenuPayload) =>
      api.post("/api/menus", payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menus", variables.storeId] });
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateMenuPayload) =>
      api.put(`/api/menus/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/menus/${id}`).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
    },
  });
}

export function useMenuQrCode(id: string) {
  return useQuery({
    queryKey: ["menus", "qr", id],
    queryFn: () =>
      api
        .get<ApiResponse<{ url: string; qrCode: string }>>(`/api/menus/${id}/qr`)
        .then((response) => response.data.data),
    enabled: !!id,
  });
}
