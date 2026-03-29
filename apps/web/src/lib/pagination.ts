import type { ApiMeta } from "@/lib/api-response";

export type AdminPageSize = number | "all";

export const DEFAULT_PAGE_SIZE_OPTIONS: AdminPageSize[] = [10, 20, 50, "all"];

export function appendPaginationParams(
  params: URLSearchParams,
  page: number,
  pageSize: AdminPageSize
) {
  if (pageSize === "all") {
    return params;
  }

  params.set("page", String(page));
  params.set("limit", String(pageSize));

  return params;
}

export function buildPaginationMeta(
  meta: ApiMeta | undefined,
  total: number,
  page: number,
  pageSize: AdminPageSize
): ApiMeta {
  if (meta) {
    return meta;
  }

  return {
    total,
    page: pageSize === "all" ? 1 : page,
    limit: pageSize === "all" ? total : pageSize,
    totalPages: total > 0 ? 1 : 0,
  };
}

export function buildClientPaginationMeta(
  total: number,
  page: number,
  pageSize: AdminPageSize
): ApiMeta {
  if (pageSize === "all") {
    return {
      total,
      page: 1,
      limit: total,
      totalPages: total > 0 ? 1 : 0,
    };
  }

  return {
    total,
    page,
    limit: pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
