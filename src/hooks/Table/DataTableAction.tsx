import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import React from "react";

export default function DataTableAction<TData>({
  actions,
}: {
  actions: React.FC<{ data: TData }>[];
}): ColumnDef<TData> {
  return {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Opsi</DropdownMenuLabel>
            {actions.map((A, i) => (
              <A key={i} data={row.original} />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
}
