import { Button } from "@/components/ui/button";
import { type Row, type Table } from "@tanstack/react-table";
import { LucideDelete } from "lucide-react";
import React from "react";
// import { MdDelete } from "react-icons/md";

function DataTableDeleteSelection<TData>({
  table,
  onDelete,
}: {
  table: Table<TData>;
  onDelete: (rows: Row<TData>[]) => void;
}) {
  const handleDelete = () => {
    const rows = table.getSelectedRowModel().rows;
    if (rows.length > 0) {
      onDelete(rows.map((x) => x));
    }

    table.setRowSelection({});
  };
  return (
    <Button
      variant="destructive"
      className="h-full"
      onClick={() => handleDelete()}
    >
      <LucideDelete />
    </Button>
  );
}

export default DataTableDeleteSelection;
