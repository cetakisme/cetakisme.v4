"use client";

import Alert from "@/components/hasan/alert";
import Authenticated from "@/components/hasan/auth/authenticated";
import { Combobox } from "@/components/hasan/combobox";
import Conditional from "@/components/hasan/conditional";
import ControlledSheet from "@/components/hasan/controlled-sheet";
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
import { DB } from "@/lib/supabase/supabase";
import { now, toRupiah } from "@/lib/utils";
import {
  expenses$,
  generateId,
  incomes$,
  incomeTypes$,
  orderMaterials$,
  orderProducts$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { Observable } from "@legendapp/state";
import { Memo, useObservable } from "@legendapp/state/react";
import { Expense, Income, IncomeType } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import moment from "moment";
import { createContext, useContext } from "react";
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

  const ctx$ = useObservable<IIncomeContext>({
    id: "",
  });

  return (
    <IncomeContext.Provider value={ctx$}>
      <ScrollArea className="h-screen p-8">
        <Title>Pemasukan</Title>
        <div className="space-y-2">
          <div className="flex h-9 justify-between">
            <DataTableFilterName table={table} />
            <div className="flex gap-2">
              <Authenticated permission="pemasukan-create">
                <AddSheet />
              </Authenticated>
              <DataTableViewOptions table={table} />
            </div>
          </div>
          <DataTableContent table={table} />
          <DataTablePagination table={table} />
        </div>
      </ScrollArea>
    </IncomeContext.Provider>
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

// const Form = () => {
//   const ctx$ = useContext(IncomeContext);

//   return (
//     <div className="space-y-2">
//       <Memo>
//         {() => {
//           const disabled = incomes$[ctx$.id.get()]!.type.get() !== "masuk";
//           return (
//             <InputWithLabel
//               label="Notes"
//               inputProps={{
//                 disabled: disabled,
//                 defaultValue: incomes$[ctx$.id.get()]!.notes.get(),
//                 onBlur: (e) => {
//                   incomes$[ctx$.id.get()]!.set((p) => ({
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
//           const disabled = incomes$[ctx$.id.get()]!.type.get() !== "masuk";
//           return (
//             <InputWithLabel
//               label="Pemasukan"
//               inputProps={{
//                 disabled: disabled,
//                 defaultValue: incomes$[ctx$.id.get()]!.income.get(),
//                 onBlur: (e) => {
//                   incomes$[ctx$.id.get()]!.set((p) => ({
//                     ...p,
//                     expense: +e.target.value,
//                     updatedAt: new Date().toISOString(),
//                   }));

//                   //   if (incomes$[ctx$.id.get()]!.type.get() === "product") {
//                   //     orderProducts$[ctx$.id.get()]!.pay.set(+e.target.value);
//                   //     return;
//                   //   }
//                 },
//               }}
//             />
//           );
//         }}
//       </Memo>
//     </div>
//   );
// };
