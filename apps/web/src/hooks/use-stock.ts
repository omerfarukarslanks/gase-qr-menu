import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginatedResult } from "@/lib/api-response";

type MovementType = "IN" | "OUT" | "ADJUSTMENT" | "WASTE";

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  ingredientUnitAbbreviation?: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  createdAt: string;
  createdByName?: string;
  unitCost?: number | null;
  referenceId?: string | null;
  resultingStock?: number | null;
}

export interface LowStockAlert {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  minStockLevel: number;
  unitAbbreviation: string;
  deficit: number;
}

export interface StockSummaryIngredient {
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  cost: number;
  unit?: { id: string; name: string; abbreviation: string } | null;
  isLowStock: boolean;
  isNegativeStock: boolean;
  lastMovementAt?: string | null;
  lastCountedAt?: string | null;
}

export interface StockSummary {
  totalIngredients: number;
  lowStockCount: number;
  totalValue: number;
  todayMovementCount: number;
  negativeStockCount: number;
  ingredients: StockSummaryIngredient[];
}

export interface StockInventoryIngredient {
  id: string;
  name: string;
  type: string;
  currentStock: number;
  lowStockThreshold: number;
  cost: number;
  unit?: { id: string; name: string; abbreviation: string } | null;
  isLowStock: boolean;
  isNegativeStock: boolean;
  lastMovementAt?: string | null;
  lastCountedAt?: string | null;
  consumptionLast30Days: number;
  wasteLast30Days: number;
}

export interface StockIngredientDetail {
  id: string;
  storeId: string;
  name: string;
  type: string;
  currentStock: number;
  lowStockThreshold: number;
  cost: number;
  unit?: { id: string; name: string; abbreviation: string } | null;
  lastCountedAt?: string | null;
  recentMovements: StockMovement[];
  consumption: {
    totalOutLast30Days: number;
    wasteLast30Days: number;
    orderOutLast30Days: number;
  };
}

export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseReceiptItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  unitAbbreviation?: string;
}

export interface PurchaseReceipt {
  id: string;
  storeId: string;
  supplier?: Supplier | null;
  invoiceNumber?: string | null;
  notes?: string | null;
  totalAmount: number;
  createdAt: string;
  createdByName?: string;
  items: PurchaseReceiptItem[];
}

interface StockMovementFilters {
  page?: number;
  pageSize?: number;
  ingredientId?: string;
  type?: MovementType | "";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface StockInventoryFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface SupplierFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface PurchaseFilters {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface StockMovementApiRecord {
  id: string;
  ingredientId: string;
  type: MovementType;
  quantity: number;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  unitCost?: number | null;
  referenceId?: string | null;
  resultingStock?: number | null;
  ingredient?: {
    name: string;
    unit?: {
      abbreviation: string;
    } | null;
  };
  createdBy?: {
    name: string;
  } | null;
}

interface LowStockAlertApiRecord {
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  deficit: number;
  unit?: {
    abbreviation: string;
  } | null;
}

interface CreateStockMovementPayload {
  storeId: string;
  ingredientId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  unitCost?: number;
  referenceId?: string;
}

interface CreateStockCountPayload {
  ingredientId: string;
  countedQuantity: number;
  notes?: string;
}

interface CreateSupplierPayload {
  storeId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

interface UpdateSupplierPayload {
  id: string;
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isActive?: boolean;
}

interface CreatePurchaseReceiptPayload {
  storeId: string;
  supplierId?: string;
  invoiceNumber?: string;
  notes?: string;
  items: Array<{
    ingredientId: string;
    quantity: number;
    unitCost: number;
  }>;
}

function mapStockMovement(item: StockMovementApiRecord): StockMovement {
  return {
    id: item.id,
    ingredientId: item.ingredientId,
    ingredientName: item.ingredient?.name ?? item.ingredientId,
    ingredientUnitAbbreviation: item.ingredient?.unit?.abbreviation ?? "",
    type: item.type,
    quantity: item.quantity,
    reason: item.reason ?? undefined,
    notes: item.notes ?? undefined,
    createdAt: item.createdAt,
    createdByName: item.createdBy?.name ?? undefined,
    unitCost: item.unitCost ?? null,
    referenceId: item.referenceId ?? null,
    resultingStock: item.resultingStock ?? null,
  };
}

function withPagination<T>(
  response: { data?: T[]; meta?: PaginatedResult<T>["meta"] },
  fallbackPage: number,
  fallbackLimit: number
) {
  return {
    data: response.data ?? [],
    meta: response.meta ?? {
      total: response.data?.length ?? 0,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages: 1,
    },
  } satisfies PaginatedResult<T>;
}

export function useStockSummary(storeId: string) {
  return useQuery({
    queryKey: ["stock", "summary", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<StockSummary>>(`/api/stock/summary/store/${storeId}`)
        .then((response) => response.data.data),
    enabled: !!storeId,
  });
}

export function useStockMovements(
  storeId: string,
  filters: StockMovementFilters = {}
) {
  const {
    page = 1,
    pageSize = 20,
    ingredientId,
    type,
    search,
    dateFrom,
    dateTo,
  } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });

  if (ingredientId) params.set("ingredientId", ingredientId);
  if (type) params.set("type", type);
  if (search) params.set("search", search);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  return useQuery({
    queryKey: ["stock-movements", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<StockMovementApiRecord[]>>(
          `/api/stock/movements/store/${storeId}?${params.toString()}`
        )
        .then((response) =>
          withPagination(
            {
              data: (response.data.data ?? []).map(mapStockMovement),
              meta: response.data.meta,
            },
            page,
            pageSize
          )
        ),
    enabled: !!storeId,
  });
}

export function useLowStockAlerts(storeId: string) {
  return useQuery({
    queryKey: ["stock", "low-alerts", storeId],
    queryFn: () =>
      api
        .get<ApiResponse<LowStockAlertApiRecord[]>>(
          `/api/stock/alerts/store/${storeId}`
        )
        .then((response) =>
          (response.data.data ?? []).map((item) => ({
            ingredientId: item.id,
            ingredientName: item.name,
            currentStock: item.currentStock,
            minStockLevel: item.lowStockThreshold,
            unitAbbreviation: item.unit?.abbreviation ?? "",
            deficit: item.deficit,
          }))
        ),
    enabled: !!storeId,
  });
}

export function useStockIngredients(
  storeId: string,
  filters: StockInventoryFilters = {}
) {
  const { page = 1, pageSize = 20, search } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });
  if (search) params.set("search", search);

  return useQuery({
    queryKey: ["stock", "ingredients", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<StockInventoryIngredient[]>>(
          `/api/stock/ingredients/store/${storeId}?${params.toString()}`
        )
        .then((response) =>
          withPagination(
            { data: response.data.data ?? [], meta: response.data.meta },
            page,
            pageSize
          )
        ),
    enabled: !!storeId,
  });
}

export function useStockIngredientDetail(ingredientId: string) {
  return useQuery({
    queryKey: ["stock", "ingredient", ingredientId],
    queryFn: () =>
      api
        .get<ApiResponse<StockIngredientDetail>>(`/api/stock/ingredients/${ingredientId}`)
        .then((response) => ({
          ...response.data.data,
          recentMovements: (response.data.data?.recentMovements ?? []).map(mapStockMovement),
        })),
    enabled: !!ingredientId,
  });
}

export function useSuppliers(storeId: string, filters: SupplierFilters = {}) {
  const { page = 1, pageSize = 20, search } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });
  if (search) params.set("search", search);

  return useQuery({
    queryKey: ["stock", "suppliers", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<Supplier[]>>(
          `/api/stock/suppliers/store/${storeId}?${params.toString()}`
        )
        .then((response) => withPagination({ data: response.data.data ?? [], meta: response.data.meta }, page, pageSize)),
    enabled: !!storeId,
  });
}

export function usePurchaseReceipts(storeId: string, filters: PurchaseFilters = {}) {
  const { page = 1, pageSize = 20, search } = filters;
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
  });
  if (search) params.set("search", search);

  return useQuery({
    queryKey: ["stock", "purchases", storeId, filters],
    queryFn: () =>
      api
        .get<ApiResponse<PurchaseReceipt[]>>(
          `/api/stock/purchases/store/${storeId}?${params.toString()}`
        )
        .then((response) =>
          withPagination(
            {
              data: (response.data.data ?? []).map((receipt) => ({
                ...receipt,
                createdByName: receipt.createdByName ?? (receipt as unknown as { createdBy?: { name?: string } }).createdBy?.name,
                items: (receipt.items ?? []).map((item) => ({
                  ...item,
                  ingredientName:
                    item.ingredientName ??
                    (item as unknown as { ingredient?: { name?: string; unit?: { abbreviation?: string } } }).ingredient?.name ??
                    item.ingredientId,
                  unitAbbreviation:
                    item.unitAbbreviation ??
                    (item as unknown as { ingredient?: { unit?: { abbreviation?: string } } }).ingredient?.unit?.abbreviation ??
                    "",
                })),
              })),
              meta: response.data.meta,
            },
            page,
            pageSize
          )
        ),
    enabled: !!storeId,
  });
}

function invalidateStockQueries(queryClient: ReturnType<typeof useQueryClient>, storeId?: string) {
  queryClient.invalidateQueries({ queryKey: ["stock"] });
  queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
  queryClient.invalidateQueries({ queryKey: ["ingredients"] });
  if (storeId) {
    queryClient.invalidateQueries({ queryKey: ["dashboard", storeId] });
  }
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStockMovementPayload) =>
      api.post("/api/stock/movements", payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      invalidateStockQueries(queryClient, variables.storeId);
    },
  });
}

export function useCreateStockCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateStockCountPayload) =>
      api.post("/api/stock/counts", payload).then((response) => response.data),
    onSuccess: () => {
      invalidateStockQueries(queryClient);
    },
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) =>
      api.post("/api/stock/suppliers", payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stock", "suppliers", variables.storeId],
      });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateSupplierPayload) =>
      api.put(`/api/stock/suppliers/${id}`, payload).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock", "suppliers"] });
    },
  });
}

export function useCreatePurchaseReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseReceiptPayload) =>
      api.post("/api/stock/purchases", payload).then((response) => response.data),
    onSuccess: (_, variables) => {
      invalidateStockQueries(queryClient, variables.storeId);
      queryClient.invalidateQueries({
        queryKey: ["stock", "suppliers", variables.storeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["stock", "purchases", variables.storeId],
      });
    },
  });
}
