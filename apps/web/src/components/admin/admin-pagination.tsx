"use client";

import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ApiMeta } from "@/lib/api-response";
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  type AdminPageSize,
} from "@/lib/pagination";

interface AdminPaginationProps {
  meta?: ApiMeta | null;
  itemLabel: string;
  onPageChange: (page: number) => void;
  pageSize?: AdminPageSize;
  onPageSizeChange?: (pageSize: AdminPageSize) => void;
  pageSizeOptions?: AdminPageSize[];
}

function getVisiblePages(currentPage: number, totalPages: number, maxVisible = 5) {
  if (totalPages <= 0) {
    return [];
  }

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const windowIndex = Math.floor((safePage - 1) / maxVisible);
  const startPage = windowIndex * maxVisible + 1;
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);

  return Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );
}

export function AdminPagination({
  meta,
  itemLabel,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: AdminPaginationProps) {
  if (!meta) {
    return null;
  }

  const canChangePageSize = typeof onPageSizeChange === "function";
  const shouldShowPager = meta.totalPages > 1;
  const visiblePages = shouldShowPager
    ? getVisiblePages(meta.page, meta.totalPages)
    : [];

  if (!canChangePageSize && !shouldShowPager) {
    return null;
  }

  const resolvedPageSize =
    pageSize ?? (meta.limit >= meta.total && meta.total > 0 ? "all" : meta.limit);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-muted-foreground">
          Toplam {meta.total} {itemLabel}, Sayfa {meta.page} / {Math.max(meta.totalPages, 1)}
        </p>
        {canChangePageSize ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Goster</span>
            <SearchableSelect
              options={pageSizeOptions.map((option) => ({
                value: String(option),
                label: option === "all" ? "Tumunu goster" : String(option),
              }))}
              value={String(resolvedPageSize)}
              onChange={(value) =>
                onPageSizeChange?.(
                  String(value) === "all" ? "all" : Number(value)
                )
              }
              placeholder="Limit sec"
              searchPlaceholder="Limit ara..."
              triggerClassName="h-9 min-w-[9rem] rounded-xl"
              contentClassName="min-w-[10rem]"
            />
          </div>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!shouldShowPager || meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Onceki
        </Button>
        {visiblePages.map((pageNumber) => (
          <Button
            key={pageNumber}
            variant={pageNumber === meta.page ? "default" : "outline"}
            size="sm"
            className="min-w-9"
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={!shouldShowPager || meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Sonraki
        </Button>
      </div>
    </div>
  );
}
