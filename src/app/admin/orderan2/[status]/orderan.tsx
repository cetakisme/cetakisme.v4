"use client";

import Title from "@/components/hasan/title";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { useTable } from "@/hooks/Table/useTable";
import { dexie } from "@/server/local/dexie";
import type { NewOrder } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { DateTime } from "luxon";
import React from "react";
import Customer from "./customer";
import { Button } from "@/components/ui/button";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import Deadline from "./deadline";
import { LucideLink, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import Histories from "./histories";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  exitItem$,
  incomes$,
  newOrders$,
  orderStatuses,
} from "@/server/local/db";
import { now } from "@/lib/utils";
import { useDialog } from "@/hooks/useDialog";
import { AturBarangSheet } from "./atur-barang.sheet";
import { Textarea } from "@/components/ui/textarea";
import { useObservable, useObserveEffect } from "@legendapp/state/react";
import { DatePicker } from "@/components/hasan/date-picker";
import { DownloadExcel } from "./download-excel";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";

const columns: ColumnDef<NewOrder>[] = [
  {
    id: "tanggal",
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal" />
    ),
    cell: ({ row }) =>
      DateTime.fromJSDate(row.original.createdAt).toLocaleString(
        DateTime.DATE_FULL,
        {
          locale: "id",
        },
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
  },
  {
    id: "name",
    accessorKey: "customer_id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <Customer
        paymentStatus={row.original.payment_status}
        customerId={row.original.customer_id}
      />
    ),
  },
  {
    id: "orderStatus",
    accessorKey: "order_status",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"outline"}>{row.original.order_status}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {orderStatuses.map((x) => (
            <DropdownMenuItem
              key={x}
              onSelect={() =>
                newOrders$[row.original.id]!.set((p) => ({
                  ...p,
                  order_status: x,
                }))
              }
            >
              {x}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    id: "deadline",
    accessorKey: "deadline",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deadline" />
    ),
    cell: ({ row }) => (
      <Deadline deadline={row.original.deadline} orderId={row.original.id} />
    ),
  },
  {
    id: "drive",
    accessorKey: "driveUrl",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Drive" />
    ),
    cell: ({ row }) =>
      row.original.driveUrl === "" ? (
        "-"
      ) : (
        <Button asChild variant="outline">
          <Link href={row.original.driveUrl} className="gap-2">
            <LucideLink />
            <span>Drive</span>
          </Link>
        </Button>
      ),
  },
  {
    id: "history",
    accessorFn: (row) => row.savedOrdersId.at(-1),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="History" />
    ),
    cell: ({ row }) => (
      <Histories
        histories={row.original.savedOrdersId}
        orderId={row.original.id}
      />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions data={row.original} />,
  },
];

const Actions: React.FC<{ data: NewOrder }> = ({ data }) => {
  const aturDialog = useDialog();
  const notesDialog = useDialog();
  const urlDialog = useDialog();
  const deleteOrder = async () => {
    const exitItem = await dexie.exitItem
      .where("orderId")
      .equals(data.id)
      .toArray();

    for (const item of exitItem) {
      exitItem$[item.id]!.delete();
    }

    incomes$[data.id]!.delete();
    newOrders$[data.id]!.delete();
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"outline"} size={"icon"}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="font-medium">Opsi</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => aturDialog.trigger()}>
            Atur Barang
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => urlDialog.trigger()}>
            Atur GDrive URL
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => notesDialog.trigger()}>
            Lihat Catatan
          </DropdownMenuItem>
          <DropdownMenuItem
            className="bg-destructive text-white"
            onClick={() => {
              void deleteOrder();
            }}
          >
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet {...urlDialog.props}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Drive URL</SheetTitle>
          </SheetHeader>
          <Textarea
            rows={5}
            defaultValue={data.driveUrl}
            onBlur={(e) =>
              newOrders$[data.id]!.set((p) => ({
                ...p,
                driveUrl: e.target.value,
              }))
            }
          />
        </SheetContent>
      </Sheet>
      <Sheet {...notesDialog.props}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Catatan</SheetTitle>
          </SheetHeader>
          <Textarea
            rows={5}
            defaultValue={data.notes}
            onBlur={(e) =>
              newOrders$[data.id]!.set((p) => ({
                ...p,
                notes: e.target.value,
              }))
            }
          />
        </SheetContent>
      </Sheet>
      <AturBarangSheet order={data} {...aturDialog.props} />
    </>
  );
};

const Orderan: React.FC<{ status: string }> = ({ status }) => {
  const orderan = useLiveQuery(() =>
    dexie.newOrders
      .where("order_status")
      .equals(status)
      .filter((x) => !x.deleted)
      .reverse()
      .sortBy("createdAt"),
  );

  const table = useTable({
    data: orderan ?? [],
    columns,
  });

  const rangeDate$ = useObservable<[Date, Date]>([
    now().toJSDate(),
    now().toJSDate(),
  ]);

  useObserveEffect(() => {
    table.getColumn("tanggal")?.setFilterValue(rangeDate$.get());
  });

  return (
    <ScrollArea className="h-screen">
      <Title>
        {status
          .split("")
          .map((x, i) => (i === 0 ? x.toUpperCase() : x))
          .join("")}
      </Title>
      <div className="space-y-2 p-1">
        <div className="">
          <div className="flex h-9 justify-between">
            <DataTableFilterName table={table} />
            <div className="flex gap-2">
              <DownloadExcel orders={orderan ?? []} />
            </div>
          </div>
          <DatePicker
            onDateChange={(date) => rangeDate$[0].set(date)}
            startYear={2024}
            endYear={2030}
          />
          <DatePicker
            onDateChange={(date) => rangeDate$[1].set(date)}
            startYear={2024}
            endYear={2030}
          />
        </div>
        <DataTableContent table={table} />
        <DataTablePagination table={table} />
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default Orderan;

export const AllOrderan: React.FC = () => {
  const orderan = useLiveQuery(() =>
    dexie.newOrders
      .filter((x) => !x.deleted)
      .reverse()
      .sortBy("createdAt"),
  );

  const table = useTable({
    data: orderan ?? [],
    columns,
  });

  const rangeDate$ = useObservable<[Date, Date]>([
    now().toJSDate(),
    now().toJSDate(),
  ]);

  useObserveEffect(() => {
    table.getColumn("tanggal")?.setFilterValue(rangeDate$.get());
  });

  return (
    <ScrollArea>
      <Title>
        {status
          .split("")
          .map((x, i) => (i === 0 ? x.toUpperCase() : x))
          .join("")}
      </Title>
      <div className="space-y-2 p-1">
        <div className="">
          <div className="flex h-9 justify-between">
            <DataTableFilterName table={table} />
            <div className="flex gap-2">
              <DownloadExcel orders={orderan ?? []} />
            </div>
          </div>
          <DatePicker
            onDateChange={(date) => rangeDate$[0].set(date)}
            startYear={2024}
            endYear={2030}
          />
          <DatePicker
            onDateChange={(date) => rangeDate$[1].set(date)}
            startYear={2024}
            endYear={2030}
          />
        </div>
        <DataTableContent table={table} />
        <DataTablePagination table={table} />
      </div>
    </ScrollArea>
  );
};
