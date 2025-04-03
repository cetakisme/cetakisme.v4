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
  orderMaterials$,
  orderProducts$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { Observable } from "@legendapp/state";
import { Memo, useObservable } from "@legendapp/state/react";
import { Expense } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import moment from "moment";
import { createContext, useContext } from "react";

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
          <Conditional condition={expense.type === "keluar"}>
            <Authenticated permission="pengeluaran-delete">
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
  const expenses = useLiveQuery(() =>
    dexie.expense
      .filter((x) => !x.deleted)
      .reverse()
      .sortBy("createdAt"),
  );

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
          <div className="flex h-9 justify-between">
            <DataTableFilterName table={table} />
            <div className="flex gap-2">
              <Authenticated permission="pengeluaran-create">
                <AddSheet />
              </Authenticated>
              <DataTableViewOptions table={table} />
            </div>
          </div>
          <DataTableContent table={table} />
          <DataTablePagination table={table} />
        </div>
      </ScrollArea>
    </ExpenseContext.Provider>
  );
};

const AddSheet = () => {
  const ctx$ = useContext(ExpenseContext);

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
            expenses$[id]!.set({
              id: id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              deleted: false,
              expense: 0,
              notes: "Pengeluaran Baru",
              type: "keluar",
              targetId: "",
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
  const ctx$ = useContext(ExpenseContext);

  return (
    <div className="space-y-2">
      <Memo>
        {() => {
          const disabled = expenses$[ctx$.id.get()]!.type.get() !== "keluar";
          return (
            <InputWithLabel
              label="notes"
              inputProps={{
                disabled: disabled,
                defaultValue: expenses$[ctx$.id.get()]!.notes.get(),
                onBlur: (e) => {
                  expenses$[ctx$.id.get()]!.set((p) => ({
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
          return (
            <InputWithLabel
              label="pengeluaran"
              inputProps={{
                defaultValue: expenses$[ctx$.id.get()]!.expense.get(),
                onBlur: (e) => {
                  expenses$[ctx$.id.get()]!.set((p) => ({
                    ...p,
                    expense: +e.target.value,
                    updatedAt: new Date().toISOString(),
                  }));

                  if (expenses$[ctx$.id.get()]!.type.get() === "product") {
                    orderProducts$[ctx$.id.get()]!.pay.set(+e.target.value);
                    return;
                  }

                  if (expenses$[ctx$.id.get()]!.type.get() === "bahan") {
                    orderMaterials$[ctx$.id.get()]!.pay.set(+e.target.value);
                    return;
                  }
                },
              }}
            />
          );
        }}
      </Memo>
    </div>
  );
};
