import { Input } from "@/components/ui/input";
import { type Table } from "@tanstack/react-table";

export function DataTableFilterName<TData>({ table }: { table: Table<TData> }) {
  return (
    <Input
      placeholder="Cari Nama..."
      value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
      onChange={(event) =>
        table.getColumn("name")?.setFilterValue(event.target.value)
      }
      className="h-full max-w-sm"
    />
  );
}
