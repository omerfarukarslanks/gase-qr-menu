"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginatedResult } from "@/lib/api-response";

export type CampaignType =
  | "PERCENTAGE"
  | "FIXED_AMOUNT"
  | "BUY_X_GET_Y"
  | "HAPPY_HOUR";

export interface CampaignLink {
  id: string;
  name: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  type: CampaignType;
  discountValue: number;
  minOrderAmount?: number | null;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  happyHourStart?: string | null;
  happyHourEnd?: string | null;
  couponCode?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number | null;
  usedCount: number;
  createdAt: string;
  products: CampaignLink[];
  categories: CampaignLink[];
}

interface CampaignApiRecord {
  id: string;
  name: string;
  description?: string | null;
  type: CampaignType;
  discountValue: number;
  minOrderAmount?: number | null;
  buyQuantity?: number | null;
  getQuantity?: number | null;
  happyHourStart?: string | null;
  happyHourEnd?: string | null;
  couponCode?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number | null;
  usedCount: number;
  createdAt: string;
  campaignProducts?: {
    product?: {
      id: string;
      slug?: string | null;
    } | null;
  }[];
  campaignCategories?: {
    category?: {
      id: string;
      slug?: string | null;
    } | null;
  }[];
}

interface CampaignFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CreateCampaignPayload {
  storeId: string;
  name: string;
  description?: string;
  type: CampaignType;
  discountValue?: number;
  minOrderAmount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  happyHourStart?: string;
  happyHourEnd?: string;
  startDate: string;
  endDate: string;
  couponCode?: string;
  usageLimit?: number;
  productIds?: string[];
  categoryIds?: string[];
}

export interface UpdateCampaignPayload {
  id: string;
  name?: string;
  description?: string;
  type?: CampaignType;
  discountValue?: number;
  minOrderAmount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  happyHourStart?: string;
  happyHourEnd?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  couponCode?: string;
  usageLimit?: number;
  productIds?: string[];
  categoryIds?: string[];
}

function mapCampaign(record: CampaignApiRecord): Campaign {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? null,
    type: record.type,
    discountValue: record.discountValue ?? 0,
    minOrderAmount: record.minOrderAmount ?? null,
    buyQuantity: record.buyQuantity ?? null,
    getQuantity: record.getQuantity ?? null,
    happyHourStart: record.happyHourStart ?? null,
    happyHourEnd: record.happyHourEnd ?? null,
    couponCode: record.couponCode ?? null,
    startDate: record.startDate,
    endDate: record.endDate,
    isActive: record.isActive,
    usageLimit: record.usageLimit ?? null,
    usedCount: record.usedCount ?? 0,
    createdAt: record.createdAt,
    products:
      record.campaignProducts
        ?.map((item) =>
          item.product
            ? {
                id: item.product.id,
                name: item.product.slug ?? "Urun",
              }
            : null
        )
        .filter((item): item is CampaignLink => item !== null) ?? [],
    categories:
      record.campaignCategories
        ?.map((item) =>
          item.category
            ? {
                id: item.category.id,
                name: item.category.slug ?? "Kategori",
              }
            : null
        )
        .filter((item): item is CampaignLink => item !== null) ?? [],
  };
}

export function useCampaigns(storeId: string, filters: CampaignFilters = {}) {
  const { page = 1, pageSize = 50, search } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });

  if (search) {
    params.set("search", search);
  }

  return useQuery({
    queryKey: ["campaigns", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<CampaignApiRecord[]>>(
          `/api/campaigns/store/${storeId}?${params.toString()}`
        )
        .then((response) => ({
          data: (response.data.data ?? []).map(mapCampaign),
          meta: response.data.meta ?? {
            total: response.data.data?.length ?? 0,
            page,
            limit: pageSize,
            totalPages: 1,
          },
        }) satisfies PaginatedResult<Campaign>),
    enabled: !!storeId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCampaignPayload) =>
      api.post("/api/campaigns", payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["campaigns", variables.storeId],
      });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCampaignPayload) =>
      api.put(`/api/campaigns/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/campaigns/${id}`).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
