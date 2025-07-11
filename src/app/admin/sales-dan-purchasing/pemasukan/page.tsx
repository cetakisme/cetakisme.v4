"use client";

import { ContentLayout } from "@/components/admin-panel/content-layout";
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
import { useExportToExcel2 } from "@/hooks/useTableExcel";
import { type DB } from "@/lib/supabase/supabase";
import { now, toRupiah } from "@/lib/utils";
import {
  generateId,
  incomes$,
  incomeTypes$,
  products$,
  productVariants$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import type { Observable } from "@legendapp/state";
import { Memo, useObservable, useObserveEffect } from "@legendapp/state/react";
import type { Income, IncomeType } from "@prisma/client";
import { Scrollbar } from "@radix-ui/react-scroll-area";
import { type ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucideDownload, LucidePlus, MoreHorizontal } from "lucide-react";
import moment from "moment";
import { createContext, useContext, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

const Page = () => {
  return (
    <Authenticated permission="pemasukan">
      <Expenses />
    </Authenticated>
  );
};

export default Page;

interface IIncomeContext {
  id: string;
}

const IncomeContext = createContext<Observable<IIncomeContext>>(
  undefined as any,
);

const columns: ColumnDef<Income>[] = [
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
    id: "pemasukan",
    accessorKey: "income",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pemasukan" />
    ),
    cell: ({ renderValue }) => toRupiah(renderValue<number>()),
  },
  {
    id: "action",
    cell: ({ row }) => <Action income={row.original} />,
  },
];

const Action: React.FC<{ income: Income }> = ({ income }) => {
  const ctx$ = useContext(IncomeContext);
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
          <Authenticated permission="pemasukan-update">
            <Conditional condition={income.type !== "order"}>
              <DropdownMenuItem
                onClick={() => {
                  ctx$.id.set(income.id);
                  editDialog.trigger();
                }}
              >
                Ubah
              </DropdownMenuItem>
            </Conditional>
          </Authenticated>
          <Conditional condition={income.type !== "order"}>
            <Authenticated permission="pemasukan-delete">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="bg-destructive text-destructive-foreground"
                onClick={() => deleteDialog.trigger()}
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
              ...income,
              createdAt: income.createdAt?.toISOString() ?? now().toISO()!,
              updatedAt: income.updatedAt.toISOString(),
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
              incomes$[income.id]!.delete();
            }}
          >
            Ya
          </Button>
        )}
      />
    </>
  );
};

const Expenses = () => {
  const incomes = useLiveQuery(() =>
    dexie.income
      .filter((x) => !x.deleted)
      .reverse()
      .sortBy("createdAt"),
  );

  const table = useTable({
    data: incomes ?? [],
    columns,
  });

  const rangeDate = useObservable<[Date, Date]>([
    now().toJSDate(),
    now().toJSDate(),
  ]);

  const incomes$ = useObservable<Income[]>([]);

  useEffect(() => {
    incomes$.set(incomes ?? []);
  }, [incomes, incomes$]);

  useObserveEffect(() => {
    table.getColumn("tanggal")?.setFilterValue(rangeDate.get());
  });

  const ctx$ = useObservable<IIncomeContext>({
    id: "",
  });

  return (
    <ContentLayout title="pemasukan">
      <IncomeContext.Provider value={ctx$}>
        <ScrollArea className="h-screen w-screen p-2 lg:w-full">
          <Scrollbar orientation="horizontal" />
          <Title>Pemasukan</Title>
          <div className="space-y-2">
            <div className="">
              <div className="flex h-9 justify-between">
                <DataTableFilterName table={table} />
                <div className="flex gap-2">
                  <Authenticated permission="pemasukan-create">
                    <AddSheet />
                  </Authenticated>
                  <Memo>
                    {() => {
                      return (
                        <DownloadExcel
                          incomes={incomes$.get()}
                          range={rangeDate.get()}
                        />
                      );
                    }}
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
      </IncomeContext.Provider>
    </ContentLayout>
  );
};

const donloadColumn: ColumnDef<Income>[] = [
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
    id: "pemasukan",
    header: "Pemasukan",
    accessorKey: "income",
  },
];

const DownloadExcel: React.FC<{ incomes: Income[]; range: [Date, Date] }> = ({
  incomes,
  range,
}) => {
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
        key: "keterangan",
        name: "Keterangan",
        width: 35,
      },
      {
        key: "tipe",
        name: "Tipe",
        width: 15,
      },
      {
        key: "pemasukan",
        name: "Pemasukan",
        width: 15,
      },
    ],
    data: async () => {
      const rows = table.getRowModel().rows.map((row) => {
        const _rows = row
          .getVisibleCells()
          .map((cell) => cell.getValue<string>());

        return _rows;
      });

      const cells = rows.map(async (row) => {
        const income = await dexie.income.get(row[0]!);

        if (income === undefined) {
          throw new Error("Income not found");
        }

        const rowDate = income.createdAt ?? now().toJSDate();
        const [start, end] = range;

        // Strip time from date
        const rowTime = new Date(rowDate.setHours(0, 0, 0, 0)).getTime();

        const startTime = new Date(start.setHours(0, 0, 0, 0)).getTime();
        const endTime = new Date(end.setHours(0, 0, 0, 0)).getTime();

        if (rowTime < startTime) return undefined;
        if (rowTime > endTime) return undefined;

        if (income.type === "order") {
          const histories = await dexie.orderHistory
            .where("orderId")
            .equals(income.id)
            .sortBy("created_at");

          const lastHistory = histories[histories.length - 1];
          if (lastHistory === undefined) {
            throw new Error("No order history found");
          }

          const orderVariants = await dexie.orderVariants
            .where("orderHistoryId")
            .equals(lastHistory.id)
            .and((o) => !o.deleted)
            .toArray();

          let i = 0;

          const stringVariants = orderVariants.reduce((acc, curr) => {
            const variant = productVariants$[curr.variant_id]!.get();
            const product = products$[variant.product_id]!.get();
            acc += `${curr.qty} ${product.name} ${variant.name}`;

            if (i === orderVariants.length - 2) {
              acc += ",\n";
            }

            i++;
            return acc;
          }, "");

          return {
            tanggal: income.createdAt,
            nama: income.notes,
            tipe: income.type,
            pemasukan: income.income,
            keterangan: stringVariants,
          };
        }

        return {
          tanggal: income.createdAt,
          nama: income.notes,
          tipe: income.type,
          pemasukan: income.income,
          keterangan: "-",
        };
      });

      const resolvedCells = await Promise.all(cells);

      return [
        {
          tanggal: "Tanggal",
          nama: "Nama",
          tipe: "Tipe",
          pemasukan: "Pemasukan",
          keterangan: "Keterangan",
        },
        ...resolvedCells.filter((x) => x !== undefined),
      ];
    },

    name: `Pemasukan - ${moment(now().toJSDate()).format("DD MMM YYYY - HH:mm A")}.xlsx`,
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

const AddSheet = () => {
  return (
    <ControlledSheet
      title="Pemasukan"
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
  income: z.number().min(1, "Masukkan Pemasukan Dahulu"),
});

const ExpenseForm: React.FC<{
  expense?: DB<"Income">;
  onSubmit: () => void;
}> = ({ expense, onSubmit }) => {
  const _expense = useObservable<DB<"Income">>({
    createdAt: expense?.createdAt ?? "",
    deleted: expense?.deleted ?? false,
    income: expense?.income ?? 0,
    id: expense?.id ?? generateId(),
    notes: expense?.notes ?? "",
    targetId: expense?.targetId ?? "",
    type: expense?.type ?? "",
    updatedAt: expense?.updatedAt ?? "",
  });

  const types = useLiveQuery(() =>
    dexie.incomeTypes.filter((x) => !x.deleted).toArray(),
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
              label="Pemasukan"
              inputProps={{
                defaultValue: _expense.income.get(),
                onBlur: (e) => _expense.income.set(+e.target.value),
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

          incomes$[_expense.id.get()]!.set({
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

const AddTypeSheet: React.FC<{ onSubmit: (e: IncomeType) => void }> = ({
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

const TypeSheetContent: React.FC<{ onSubmit: (e: IncomeType) => void }> = ({
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

          incomeTypes$[id]!.set(type);
          onSubmit(type);
        }}
      >
        Submit
      </Button>
    </div>
  );
};
