"use client";

import Alert from "@/components/hasan/alert";
import Authenticated from "@/components/hasan/auth/authenticated";
import { Combobox } from "@/components/hasan/combobox";
import Conditional from "@/components/hasan/conditional";
import ControlledSheet from "@/components/hasan/controlled-sheet";
import { DatePicker } from "@/components/hasan/date-picker";
import InputWithLabel from "@/components/hasan/input-with-label";
import Sheet from "@/components/hasan/sheet";
import Title from "@/components/hasan/title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { useTable } from "@/hooks/Table/useTable";
import { useDialog } from "@/hooks/useDialog";
import { useExportToExcel, useExportToExcel2 } from "@/hooks/useTableExcel";
import { type DB } from "@/lib/supabase/supabase";
import { now, toRupiah } from "@/lib/utils";
import { expenses$, expenseTypes$, generateId } from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { type Observable } from "@legendapp/state";
import { Memo, useObservable, useObserveEffect } from "@legendapp/state/react";
import type { Expense, ExpenseType } from "@prisma/client";
import { type ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucideDownload, LucidePlus, MoreHorizontal } from "lucide-react";
import moment from "moment";
import React, { createContext, useContext } from "react";
import { toast } from "sonner";
import { z } from "zod";

const Page = () => {
  return (
    <Authenticated permission="pengeluaran">
      <Expenses />
    </Authenticated>
  );
};

export default Page;

interface IExpenseContext {
  id: string;
}

const ExpenseContext = createContext<Observable<IExpenseContext>>(
  undefined as any,
);

const columns: ColumnDef<Expense>[] = [
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
    id: "tipe",
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe" />
    ),
    cell: ({ row }) => <Badge>{row.original.type}</Badge>,
  },
  {
    id: "pengeluaran",
    accessorKey: "expense",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pengeluaran" />
    ),
    cell: ({ renderValue }) => toRupiah(renderValue<number>()),
  },
  {
    id: "action",
    cell: ({ row }) => <Action expense={row.original} />,
  },
];

const Action: React.FC<{ expense: Expense }> = ({ expense }) => {
  const ctx$ = useContext(ExpenseContext);
  const editDialog = useDialog();
  const deleteDialog = useDialog();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="font-medium">Opsi</DropdownMenuItem>
          <DropdownMenuSeparator />
          <Authenticated permission="pengeluaran-update">
            <DropdownMenuItem
              onClick={() => {
                ctx$.id.set(expense.id);
                editDialog.trigger();
              }}
            >
              Ubah
            </DropdownMenuItem>
          </Authenticated>
          <Conditional
            condition={expense.type !== "produk" && expense.type !== "bahan"}
          >
            <Authenticated permission="pengeluaran-delete">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="bg-destructive text-destructive-foreground"
                onClick={() => {
                  deleteDialog.trigger();
                }}
              >
                Hapus
              </DropdownMenuItem>
            </Authenticated>
          </Conditional>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet
        title="Pengeluaran"
        content={() => (
          <ExpenseForm
            expense={{
              ...expense,
              createdAt: expense.createdAt.toISOString(),
              updatedAt: expense.updatedAt.toISOString(),
            }}
            onSubmit={editDialog.dismiss}
          />
        )}
        {...editDialog.props}
      />
      <Alert
        {...deleteDialog.props}
        title="Yakin Ingin Menghapus ?"
        description="Pengeluaran yang dihapus tidak dapat dikembailkan lagi"
        renderCancel={() => <Button>Tidak</Button>}
        renderAction={() => (
          <Button
            onClick={() => {
              expenses$[expense.id]!.delete();
            }}
          >
            Ya
          </Button>
        )}
      />
    </>
  );
};

const donloadColumn: ColumnDef<Expense>[] = [
  {
    id: "tanggal",
    accessorKey: "createdAt",
    // accessorFn: (original) => moment(original.createdAt).format("DD MMM YYYY"),
    cell: ({ row }) => row.original.createdAt,
  },
  {
    id: "name",
    accessorKey: "notes",
  },
  {
    id: "type",
    accessorKey: "type",
  },
  {
    id: "pengeluaran",
    accessorKey: "expense",
  },
];

const DownloadExcel: React.FC<{ expense: Expense[]; range: [Date, Date] }> = ({
  expense,
  range,
}) => {
  const table = useTable({
    data: expense,
    columns: donloadColumn,
  });

  const download = useExportToExcel2({
    data: async () => {
      const rows: any[] = table.getRowModel().rows.map((row) => {
        const _rows = row.getVisibleCells().map((cell) => cell.getValue<any>());
        return _rows;
      });

      const filtered = rows
        .map((x) => {
          const rowDate = new Date(x[0]);
          const [start, end] = range;

          // Strip time from date
          const rowTime = new Date(rowDate.setHours(0, 0, 0, 0)).getTime();

          const startTime = new Date(start.setHours(0, 0, 0, 0)).getTime();
          const endTime = new Date(end.setHours(0, 0, 0, 0)).getTime();

          if (rowTime < startTime) return undefined;
          if (rowTime > endTime) return undefined;
          return x;
        })
        .filter((x) => x !== undefined);

      const cells = filtered.map((row) => ({
        tanggal: row[0],
        nama: row[1],
        tipe: row[2],
        pengeluaran: row[3],
      }));

      return [
        {
          tanggal: "Tanggal",
          nama: "Nama",
          tipe: "Tipe",
          pengeluaran: "Pengeluaran",
        },
        ...cells.filter((x) => x !== undefined),
      ];
    },
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
        key: "tipe",
        name: "Tipe",
        width: 15,
      },
      {
        key: "pengeluaran",
        name: "Pengeluaran",
        width: 15,
      },
    ],
    name: `Pengeluaran - ${moment(now().toJSDate()).format("DD MMM YYYY - HH:mm A")}.xlsx`,
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
        });
      });

      sheet
        .getColumn(4)
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

const Expenses = () => {
  const expenses = useLiveQuery(() =>
    dexie.expense
      .filter((x) => !x.deleted)
      .reverse()
      .sortBy("createdAt"),
  );

  React.useEffect(() => {
    expenses$.set(expenses ?? []);
  }, [expenses]);

  const expenses$ = useObservable<Expense[]>([]);

  const rangeDate = useObservable<[Date, Date]>([
    now().toJSDate(),
    now().toJSDate(),
  ]);

  useObserveEffect(() => {
    table.getColumn("tanggal")?.setFilterValue(rangeDate.get());
  });

  const table = useTable({
    data: expenses ?? [],
    columns,
  });

  const ctx$ = useObservable<IExpenseContext>({
    id: "",
  });

  return (
    <ExpenseContext.Provider value={ctx$}>
      <ScrollArea className="h-screen p-8">
        <Title>Pengeluaran</Title>
        <div className="space-y-2">
          <div className="">
            <div className="flex h-9 justify-between">
              <DataTableFilterName table={table} />
              <div className="flex gap-2">
                <Authenticated permission="pengeluaran-create">
                  <AddSheet />
                </Authenticated>
                <Memo>
                  {() => (
                    <DownloadExcel
                      expense={expenses$.get()}
                      range={rangeDate.get()}
                    />
                  )}
                </Memo>
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
    </ExpenseContext.Provider>
  );
};

const AddSheet = () => {
  return (
    <ControlledSheet
      title="Pengeluaran"
      content={(dismiss) => <ExpenseForm onSubmit={dismiss} />}
      trigger={(trigger) => (
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            trigger();
          }}
        >
          <LucidePlus />
        </Button>
      )}
    />
  );
};

const expenseSchema = z.object({
  notes: z.string().min(1, "Masukkan Note Dahulu"),
  type: z.string().min(1, "Masukkan Tipe Dahulu"),
  expense: z.number().min(1, "Masukkan Pengeluaran Dahulu"),
});

const ExpenseForm: React.FC<{
  expense?: DB<"Expense">;
  onSubmit: () => void;
}> = ({ expense, onSubmit }) => {
  const _expense = useObservable<DB<"Expense">>({
    createdAt: expense?.createdAt ?? "",
    deleted: expense?.deleted ?? false,
    expense: expense?.expense ?? 0,
    id: expense?.id ?? generateId(),
    notes: expense?.notes ?? "",
    targetId: expense?.targetId ?? "",
    type: expense?.type ?? "",
    updatedAt: expense?.updatedAt ?? "",
  });

  const types = useLiveQuery(() =>
    dexie.expenseTypes.filter((x) => !x.deleted).toArray(),
  );

  return (
    <div className="space-y-2">
      <Memo>
        {() => {
          return (
            <InputWithLabel
              label="Note"
              inputProps={{
                disabled:
                  expense?.type === "produk" || expense?.type === "bahan",
                defaultValue: _expense.notes.get(),
                onBlur: (e) => _expense.notes.set(e.target.value),
              }}
            />
          );
        }}
      </Memo>
      <Memo>
        {() => {
          return (
            <InputWithLabel
              label="Pengeluaran"
              inputProps={{
                defaultValue: _expense.expense.get(),
                onBlur: (e) => _expense.expense.set(+e.target.value),
              }}
            />
          );
        }}
      </Memo>
      {expense?.type !== "produk" && expense?.type !== "bahan" && (
        <div className="flex flex-col gap-2">
          <Label>Tipe</Label>
          <Combobox
            data={types ?? []}
            onSelected={(e) => _expense.type.set(e.name)}
            renderItem={(e) => e.name}
            renderSelected={() => (
              <Memo>
                {() =>
                  _expense.type.get() === ""
                    ? "Pilih Tipe"
                    : _expense.type.get()
                }
              </Memo>
            )}
            title="Tipe"
            renderAddButton={() => (
              <AddTypeSheet onSubmit={(e) => _expense.type.set(e.name)} />
            )}
          />
        </div>
      )}
      <Button
        className="w-full"
        onClick={() => {
          const result = expenseSchema.safeParse(_expense.get());
          if (!result.success) {
            toast.error(result.error.errors[0]!.message);
            return;
          }

          expenses$[_expense.id.get()]!.set({
            ..._expense.get(),
            createdAt: now().toISO()!,
            updatedAt: now().toISO()!,
          });

          onSubmit();
        }}
      >
        Submit
      </Button>
    </div>
  );
};

const AddTypeSheet: React.FC<{ onSubmit: (e: ExpenseType) => void }> = ({
  onSubmit,
}) => {
  return (
    <ControlledSheet
      title="Tipe"
      trigger={(trigger) => (
        <div className="p-1">
          <Button onClick={trigger} className="w-full">
            <LucidePlus /> Buat Tipe Baru
          </Button>
        </div>
      )}
      content={(dissmiss) => (
        <TypeSheetContent
          onSubmit={(e) => {
            onSubmit(e);
            dissmiss();
          }}
        />
      )}
    />
  );
};

const TypeSheetContent: React.FC<{ onSubmit: (e: ExpenseType) => void }> = ({
  onSubmit,
}) => {
  const name = useObservable("");
  return (
    <div className="space-y-2">
      <Memo>
        {() => (
          <InputWithLabel
            label="Nama"
            inputProps={{
              defaultValue: "",
              onBlur: (e) => name.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Button
        className="w-full"
        onClick={() => {
          if (name.get().toLocaleLowerCase() === "produk") {
            toast.error('Tidak Bisa Menggunakan Nama "produk"');
            return;
          }

          if (name.get().toLocaleLowerCase() === "bahan") {
            toast.error('Tidak Bisa Menggunakan Nama "bahan"');
            return;
          }

          const id = generateId();
          const type = {
            id: id,
            deleted: false,
            name: name.get().toLocaleLowerCase(),
          };

          expenseTypes$[id]!.set(type);
          onSubmit(type);
        }}
      >
        Submit
      </Button>
    </div>
  );
};

// const Form = () => {
//   const ctx$ = useContext(ExpenseContext);

//   return (
//     <div className="space-y-2">
//       <Memo>
//         {() => {
//           const disabled = expenses$[ctx$.id.get()]!.type.get() === "keluar";
//           return (
//             <InputWithLabel
//               label="notes"
//               inputProps={{
//                 disabled: disabled,
//                 defaultValue: expenses$[ctx$.id.get()]!.notes.get(),
//                 onBlur: (e) => {
//                   expenses$[ctx$.id.get()]!.set((p) => ({
//                     ...p,
//                     notes: e.target.value,
//                     updatedAt: new Date().toISOString(),
//                   }));
//                 },
//               }}
//             />
//           );
//         }}
//       </Memo>
//       <Memo>
//         {() => {
//           return (
//             <InputWithLabel
//               label="pengeluaran"
//               inputProps={{
//                 defaultValue: expenses$[ctx$.id.get()]!.expense.get(),
//                 onBlur: (e) => {
//                   expenses$[ctx$.id.get()]!.set((p) => ({
//                     ...p,
//                     expense: +e.target.value,
//                     updatedAt: new Date().toISOString(),
//                   }));

//                   if (expenses$[ctx$.id.get()]!.type.get() === "product") {
//                     orderProducts$[ctx$.id.get()]!.pay.set(+e.target.value);
//                     return;
//                   }

//                   if (expenses$[ctx$.id.get()]!.type.get() === "bahan") {
//                     orderMaterials$[ctx$.id.get()]!.pay.set(+e.target.value);
//                     return;
//                   }
//                 },
//               }}
//             />
//           );
//         }}
//       </Memo>
//     </div>
//   );
// };
