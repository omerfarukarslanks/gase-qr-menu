import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ResponsiveDataColumn<T> {
  header: string;
  className?: string;
  cell: (item: T) => ReactNode;
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: ResponsiveDataColumn<T>[];
  getKey: (item: T) => string;
  mobileCard: (item: T) => ReactNode;
  tableClassName?: string;
  mobileClassName?: string;
  rowClassName?: string;
}

export function ResponsiveDataTable<T>({
  data,
  columns,
  getKey,
  mobileCard,
  tableClassName,
  mobileClassName,
  rowClassName,
}: ResponsiveDataTableProps<T>) {
  return (
    <>
      <div className={cn("space-y-3 md:hidden", mobileClassName)}>
        {data.map((item) => (
          <div
            key={getKey(item)}
            className="rounded-[1.5rem] border border-border bg-card p-4 shadow-[var(--card-shadow)]"
          >
            {mobileCard(item)}
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className={cn("w-full text-sm", tableClassName)}>
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                {columns.map((column) => (
                  <th
                    key={column.header}
                    className={cn(column.className, "pb-4 font-medium")}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={getKey(item)}
                  className={cn(
                    "border-b transition-colors odd:bg-muted/20 hover:bg-muted/40 last:border-0",
                    rowClassName
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.header} className={cn(column.className, "py-3")}>
                      {column.cell(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
