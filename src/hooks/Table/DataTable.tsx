import { type Table } from "@tanstack/react-table";
import { DataTableViewOptions } from "./DataTableViewOptions";
import { DataTableContent } from "./DataTableContent";
import { DataTablePagination } from "./DataTablePagination";

export function DataTable<TData extends { id: string }>({
  table,
  header,
}: {
  table: Table<TData>;
  header?: (table: Table<TData>) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center py-4">
        <div className="flex gap-1">{header?.(table)}</div>
        <DataTableViewOptions table={table} />
      </div>
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
