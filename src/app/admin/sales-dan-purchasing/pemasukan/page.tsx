"use client";

import Alert from "@/components/hasan/alert";
import Authenticated from "@/components/hasan/auth/authenticated";
import Conditional from "@/components/hasan/conditional";
import ControlledSheet from "@/components/hasan/controlled-sheet";
import InputWithLabel from "@/components/hasan/input-with-label";
import Sheet from "@/components/hasan/sheet";
import Title from "@/components/hasan/title";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { useTable } from "@/hooks/Table/useTable";
import { useDialog } from "@/hooks/useDialog";
import { toRupiah } from "@/lib/utils";
import {
  expenses$,
  generateId,
  incomes$,
  orderMaterials$,
  orderProducts$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { Observable } from "@legendapp/state";
import { Memo, useObservable } from "@legendapp/state/react";
import { Expense, Income } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import moment from "moment";
import { createContext, useContext } from "react";

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

const Action: React.FC<{ income: Income }> = ({ income: expense }) => {
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
            <DropdownMenuItem
              onClick={() => {
                ctx$.id.set(expense.id);
                editDialog.trigger();
              }}
            >
              Ubah
            </DropdownMenuItem>
          </Authenticated>
          <Conditional condition={expense.type === "keluar"}>
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
        content={() => <Form />}
        {...editDialog.props}
      />
      <Conditional condition={expense.type === "keluar"}>
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
      </Conditional>
    </>
  );
};

const Expenses = () => {
  const incomes = useLiveQuery(() =>
    dexie.income.filter((x) => !x.deleted).toArray(),
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
  const ctx$ = useContext(IncomeContext);

  return (
    <ControlledSheet
      title="Pengeluaran"
      content={() => <Form />}
      trigger={(trigger) => (
        <Button
          size="icon"
          variant="outline"
          onClick={() => {
            const id = generateId();
            incomes$[id]!.set({
              id: id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              deleted: false,
              income: 0,
              notes: "Pemasukan Baru",
              type: "masuk",
            });
            ctx$.id.set(id);
            trigger();
          }}
        >
          <LucidePlus />
        </Button>
      )}
    />
  );
};

const Form = () => {
  const ctx$ = useContext(IncomeContext);

  return (
    <div className="space-y-2">
      <Memo>
        {() => {
          const disabled = incomes$[ctx$.id.get()]!.type.get() !== "masuk";
          return (
            <InputWithLabel
              label="Notes"
              inputProps={{
                disabled: disabled,
                defaultValue: incomes$[ctx$.id.get()]!.notes.get(),
                onBlur: (e) => {
                  incomes$[ctx$.id.get()]!.set((p) => ({
                    ...p,
                    notes: e.target.value,
                    updatedAt: new Date().toISOString(),
                  }));
                },
              }}
            />
          );
        }}
      </Memo>
      <Memo>
        {() => {
          const disabled = incomes$[ctx$.id.get()]!.type.get() !== "masuk";
          return (
            <InputWithLabel
              label="Pemasukan"
              inputProps={{
                disabled: disabled,
                defaultValue: incomes$[ctx$.id.get()]!.income.get(),
                onBlur: (e) => {
                  incomes$[ctx$.id.get()]!.set((p) => ({
                    ...p,
                    expense: +e.target.value,
                    updatedAt: new Date().toISOString(),
                  }));

                  //   if (incomes$[ctx$.id.get()]!.type.get() === "product") {
                  //     orderProducts$[ctx$.id.get()]!.pay.set(+e.target.value);
                  //     return;
                  //   }
                },
              }}
            />
          );
        }}
      </Memo>
    </div>
  );
};
