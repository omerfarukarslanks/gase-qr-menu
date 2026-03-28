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
                    className={cn("pb-3 font-medium", column.className)}
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
                  className={cn("border-b last:border-0", rowClassName)}
                >
                  {columns.map((column) => (
                    <td key={column.header} className={cn("py-3", column.className)}>
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
