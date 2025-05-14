"use client";

import Authenticated from "@/components/hasan/auth/authenticated";
import { DatePicker } from "@/components/hasan/date-picker";
import Title from "@/components/hasan/title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { useTable } from "@/hooks/Table/useTable";
import { useExportToExcel2 } from "@/hooks/useTableExcel";
import { now, toRupiah } from "@/lib/utils";
import { dexie } from "@/server/local/dexie";
import { useObservable, useObserveEffect } from "@legendapp/state/react";
import { type ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucideDownload } from "lucide-react";
import moment from "moment";
import React from "react";

const Page = () => {
  return (
    <Authenticated permission="pemasukan">
      <Expenses />
    </Authenticated>
  );
};

export default Page;

// interface IIncomeContext {
//   id: string;
// }

// const IncomeContext = createContext<Observable<IIncomeContext>>(
//   undefined as any,
// );

const columns: ColumnDef<{
  harga: number;
  id: string;
  type: string;
  label: string;
  targetId: string;
  notes: string;
  deleted: boolean;
  createdAt: Date | null;
  updatedAt: Date;
}>[] = [
  {
    id: "tanggal",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal" />
    ),
    filterFn: (row, columnId, filterValue: [Date | null, Date | null]) => {
      const rowDate = new Date(row.getValue(columnId));
      const [start, end] = filterValue;

      // Strip time from date
      const rowTime = new Date(rowDate.setHours(0, 0, 0, 0)).getTime();

      const startTime = start
        ? new Date(start.setHours(0, 0, 0, 0)).getTime()
        : null;
      const endTime = end ? new Date(end.setHours(0, 0, 0, 0)).getTime() : null;

      if (startTime && rowTime < startTime) return false;
      if (endTime && rowTime > endTime) return false;

      return true;
    },
    cell: ({ row }) => moment(row.original.createdAt).format("DD MMM YYYY"),
  },
  {
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ renderValue }) => (
      <div className="font-medium">{renderValue<string>()}</div>
    ),
    accessorKey: "notes",
    size: 1000,
  },
  {
    id: "label",
    accessorKey: "label",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Label" />
    ),
  },
  {
    id: "tipe",
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe" />
    ),
    cell: ({ row }) => <Badge>{row.original.type}</Badge>,
  },
  {
    id: "harga",
    accessorKey: "harga",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pemasukan" />
    ),
    cell: ({ renderValue }) => toRupiah(renderValue<number>()),
  },
];

const Expenses = () => {
  const incomes = useLiveQuery(() =>
    dexie.income
      .filter((x) => !x.deleted)
      .reverse()
      .sortBy("createdAt"),
  );

  const expenses = useLiveQuery(() =>
    dexie.expense
      .filter((x) => !x.deleted)
      .reverse()
      .sortBy("createdAt"),
  );

  const [data, setData] = React.useState<
    {
      harga: number;
      id: string;
      type: string;
      targetId: string;
      notes: string;
      deleted: boolean;
      label: string;
      createdAt: Date | null;
      updatedAt: Date;
    }[]
  >([]);

  React.useEffect(() => {
    if (!incomes || !expenses) return;
    setData([
      ...(incomes?.map((x) => ({
        ...x,
        harga: x.income,
        label: "pemasukan",
      })) ?? []),
      ...(expenses?.map((x) => ({
        ...x,
        harga: x.expense,
        label: "pengeluaran",
      })) ?? []),
    ]);
  }, [incomes, expenses]);

  const table = useTable({
    data: data,
    columns,
  });

  const rangeDate = useObservable<[Date, Date]>([
    now().toJSDate(),
    now().toJSDate(),
  ]);

  useObserveEffect(() => {
    table.getColumn("tanggal")?.setFilterValue(rangeDate.get());
  });

  return (
    <ScrollArea className="h-screen p-8">
      <Title>Pemasukan</Title>
      <div className="space-y-2">
        <div className="">
          <div className="flex h-9 justify-between">
            <DataTableFilterName table={table} />
            <div className="flex gap-2">
              <DownloadExcel incomes={data} />
              <DataTableViewOptions table={table} />
            </div>
          </div>
          <DatePicker onDateChange={(date) => rangeDate[0].set(date)} />
          <DatePicker onDateChange={(date) => rangeDate[1].set(date)} />
        </div>
        <DataTableContent table={table} />
        <DataTablePagination table={table} />
      </div>
    </ScrollArea>
  );
};

const donloadColumn: ColumnDef<{
  harga: number;
  id: string;
  type: string;
  targetId: string;
  notes: string;
  label: string;
  deleted: boolean;
  createdAt: Date | null;
  updatedAt: Date;
}>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "ID",
  },
  {
    id: "tanggal",
    header: "Tanggal",
    // accessorFn: (original) => moment(original.createdAt).format("DD MMM YYYY"),
    accessorKey: "createdAt",
  },
  {
    id: "name",
    accessorKey: "notes",
    header: "Nama",
  },
  {
    id: "type",
    header: "Tipe",
    accessorKey: "type",
  },
  {
    id: "harga",
    header: "Harga",
    accessorKey: "harga",
  },
  {
    id: "label",
    header: "Label",
    accessorKey: "label",
  },
];

const DownloadExcel: React.FC<{
  incomes: {
    harga: number;
    id: string;
    type: string;
    targetId: string;
    notes: string;
    deleted: boolean;
    label: string;
    createdAt: Date | null;
    updatedAt: Date;
  }[];
}> = ({ incomes }) => {
  const table = useTable({
    data: incomes,
    columns: donloadColumn,
  });

  const download = useExportToExcel2({
    headers: [
      {
        key: "tanggal",
        name: "Tanggal",
        width: 15,
      },
      {
        key: "nama",
        name: "Nama",
        width: 35,
      },
      {
        key: "label",
        name: "Label",
        width: 15,
      },
      {
        key: "tipe",
        name: "Tipe",
        width: 15,
      },
      {
        key: "harga",
        name: "Harga",
        width: 20,
      },
    ],
    data: async () => {
      const rows = table.getRowModel().rows.map((row) => {
        const _rows = row
          .getVisibleCells()
          .map((cell) => cell.getValue<string>());

        return _rows;
      });

      const resolvedCells = rows.map((x) => {
        return {
          tanggal: x[1]!,
          nama: x[2]!,
          tipe: x[3]!,
          harga: x[4]!,
          label: x[5]!,
        };
      });

      return [
        {
          tanggal: "Tanggal",
          nama: "Nama",
          label: "Jenis",
          tipe: "Tipe",
          harga: "Harga",
        },
        ...resolvedCells,
      ];
    },

    name: `Gabungan - ${moment(now().toJSDate()).format("DD MMM YYYY - HH:mm A")}.xlsx`,
    style: (sheet) => {
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      sheet.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (colNumber === 1) {
            cell.numFmt = "dd/mm/yyyy";
          }

          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          cell.alignment = {
            ...cell.alignment,
            vertical: "top",
          };

          if (colNumber === 3) {
            cell.alignment = {
              ...cell.alignment,
              wrapText: true,
            };
          }
        });
      });

      sheet
        .getColumn(5)
        .eachCell({ includeEmpty: false }, (cell, rowNumber) => {
          if (rowNumber !== 1) {
            cell.numFmt = '"Rp. "#,##0';
          }
        });
      return sheet;
    },
  });

  return (
    <Button onClick={() => download()} variant={"outline"} size={"icon"}>
      <LucideDownload />
    </Button>
  );
};
