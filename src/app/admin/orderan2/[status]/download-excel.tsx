import { Button } from "@/components/ui/button";
import { useTable } from "@/hooks/Table/useTable";
import { useExportToExcel2 } from "@/hooks/useTableExcel";
import { now } from "@/lib/utils";
import { dexie } from "@/server/local/dexie";
import type { NewOrder } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { LucideDownload } from "lucide-react";
import moment from "moment";

const donloadColumn: ColumnDef<NewOrder>[] = [
  {
    id: "id",
    accessorKey: "id",
  },
  {
    id: "tanggal",
    accessorKey: "createdAt",
  },
  {
    id: "name",
    accessorKey: "customer_id",
  },
  {
    id: "orderStatus",
    accessorKey: "order_status",
  },
  {
    id: "paymentStatus",
    accessorKey: "payment_status",
  },
  {
    id: "saveOrdersId",
    accessorKey: "savedOrdersId",
  },
  {
    id: "notes",
    accessorKey: "notes",
  },
  {
    id: "deadline",
    accessorKey: "deadline",
  },
  {
    id: "customer",
    accessorKey: "customer_id",
  },
];

export const DownloadExcel: React.FC<{
  orders: NewOrder[];
}> = ({ orders }) => {
  // const orders = useLiveQuery(() =>
  //   dexie.newOrders.filter((x) => !x.deleted).sortBy("createdAt"),
  // );
  const table = useTable({
    data: orders,
    columns: donloadColumn,
  });

  const download = useExportToExcel2({
    data: async () => {
      const rows: any[] = table.getRowModel().rows.map((row) => {
        const _rows = row.getVisibleCells().map((cell) => cell.getValue<any>());
        return _rows;
      });
      console.log(rows);

      const data = await Promise.all(
        rows.map(async (x) => {
          const orderStatus = x[3]!;
          const paymentStatus = x[4]!;
          const savedOrdersId: string[] = x[5];
          const notes = x[6]!;
          const deadline = x[7]!;
          const customerId = x[8]!;

          const lastSavedOrder = savedOrdersId.at(0);

          const savedOrder = await dexie.savedOrders.get(lastSavedOrder!);
          if (!savedOrder) {
            throw new Error("Order Not Found");
          }

          const customer = await dexie.customers.get(customerId);

          // if (!customer) {
          //   throw new Error("Customer Not Found");
          // }

          const products = await dexie.savedOrderProducts
            .where("savedOrderId")
            .equals(savedOrder.id)
            .sortBy("name");

          const total =
            savedOrder.totalProducts -
            savedOrder.totalDiscounts +
            savedOrder.totalCosts;

          return {
            tanggal: savedOrder.creteadAt,
            nama: customer?.name ?? "NOT FOUND",
            orderStatus: orderStatus,
            paymentStatus: paymentStatus,
            total: total,
            bayar: savedOrder.paid,
            deadline: deadline,
            notes: notes,
            hutang: savedOrder.paid < total ? total - savedOrder.paid : 0,
            barang: products.map((x) => `${x.qty} ${x.name}`).join(", "),
          };
        }),
      );

      return [
        {
          tanggal: "Tanggal",
          nama: "Nama",
          orderStatus: "Status Order",
          paymentStatus: "Status Pembayaran",
          total: "Total",
          bayar: "Bayar",
          hutang: "Hutang",
          deadline: "Deadline",
          notes: "Notes",
          barang: "Barang",
        },
        ...data.filter((x) => x !== undefined),
      ];
    },
    headers: [
      {
        key: "tanggal",
        name: "Tanggal",
        width: 15,
      },
      {
        key: "deadline",
        name: "Deadline",
        width: 15,
      },
      {
        key: "nama",
        name: "Nama",
        width: 25,
      },
      {
        key: "orderStatus",
        name: "Status Order",
        width: 25,
      },
      {
        key: "paymentStatus",
        name: "Status Pembayaran",
        width: 25,
      },
      {
        key: "total",
        name: "Total",
        width: 15,
      },
      {
        key: "bayar",
        name: "Bayar",
        width: 15,
      },
      {
        key: "hutang",
        name: "Hutang",
        width: 15,
      },
      {
        key: "notes",
        name: "Notes",
        width: 35,
      },
      {
        key: "barang",
        name: "Barang",
        width: 35,
      },
    ],
    name: `Orderan - ${moment(now().toJSDate()).format("DD MMM YYYY - HH:mm A")}.xlsx`,
    style: (sheet) => {
      sheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      sheet.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if (colNumber === 1 || colNumber === 2) {
            cell.numFmt = "dd/mm/yyyy";
          }

          if (colNumber === 6 || colNumber === 7 || colNumber === 8) {
            cell.numFmt = '"Rp. "#,##0';
          }

          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
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
