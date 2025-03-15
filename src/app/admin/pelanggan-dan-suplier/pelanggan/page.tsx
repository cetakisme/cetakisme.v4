"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Customer } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import React, { createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import ControlledSheet from "@/components/hasan/controlled-sheet";
import InputWithLabel from "@/components/hasan/input-with-label";
import { customer$, generateId } from "@/server/local/db";
import { Memo, useObservable } from "@legendapp/state/react";
import { useTable } from "@/hooks/Table/useTable";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import { type Observable } from "@legendapp/state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDialog } from "@/hooks/useDialog";
import Sheet from "@/components/hasan/sheet";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import Alert from "@/components/hasan/alert";
import { useLiveQuery } from "dexie-react-hooks";
import { dexie } from "@/server/local/dexie";
import Authenticated from "@/components/hasan/auth/authenticated";
import AuthFallback from "@/components/hasan/auth/auth-fallback";

const CustomerContext = createContext<Observable<ICustomerContext>>(
  undefined as any,
);

const columns: ColumnDef<Customer>[] = [
  {
    id: "name",
    accessorKey: "name",
    size: 2000,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => (
      <Memo>
        {() => (
          <div className="font-medium">
            {customer$[row.original.id]?.name.get()}
          </div>
        )}
      </Memo>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions customer={row.original} />,
  },
];

const Actions: React.FC<{ customer: Customer }> = ({ customer }) => {
  const deleteDialog = useDialog();
  const updateDialog = useDialog();
  const _customer$ = useContext(CustomerContext);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              _customer$.customerId.set(customer.id);
              updateDialog.trigger();
            }}
          >
            Ubah
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => {
                deleteDialog.trigger();
              }}
            >
              Hapus
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet
        {...updateDialog.props}
        title="Ubah Info Pelanggan"
        description=""
        content={() => <CustomerForm />}
      />
      <Alert
        {...deleteDialog.props}
        title="Apa Anda Yakin?"
        description="Data Yang Dihapus Sudah Tidak Bisa Kembali Lagi"
        renderCancel={() => <Button>Tidak</Button>}
        renderAction={() => (
          <Button
            variant="destructive"
            onClick={() => {
              customer$[customer.id]!.delete();
            }}
          >
            Ya
          </Button>
        )}
      />
    </>
  );
};

const Page = () => {
  return (
    <Authenticated permission="pelanggan" fallback={AuthFallback}>
      <Customers />
    </Authenticated>
  );
};

const Customers = () => {
  const customerId = useObservable({ customerId: "" });

  const customers = useLiveQuery(() =>
    dexie.customers.filter((x) => x.deleted === false).toArray(),
  );

  return (
    <ScrollArea className="h-screen p-8">
      <CustomerContext.Provider value={customerId}>
        <Table data={customers ?? []} />
      </CustomerContext.Provider>
    </ScrollArea>
  );
};

interface ICustomerContext {
  customerId: string;
}

const Table: React.FC<{ data: Customer[] }> = ({ data }) => {
  const table = useTable({
    columns: columns,
    data: data,
  });

  return (
    <div className="space-y-2">
      <div className="flex h-9 justify-between">
        <DataTableFilterName table={table} />
        <div className="flex gap-2">
          <CustomerSheet />
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
};

export default Page;

const CustomerSheet = () => {
  const _customer$ = useContext(CustomerContext);
  return (
    <ControlledSheet
      title="Tambah Customer"
      description="Isi formulir dengan data yang tepat"
      trigger={(trigger) => (
        <Button
          variant="outline"
          onClick={() => {
            const id = generateId();
            customer$[id]!.set({
              id: id,
              name: "Pelanggan Baru",
              address: "",
              age: 0,
              job: "",
              notes: "",
              phone: "",
              deleted: false,
            });
            _customer$.customerId.set(id);
            trigger();
          }}
        >
          <LucidePlus />
        </Button>
      )}
      content={() => <CustomerForm />}
    />
  );
};

const CustomerForm = () => {
  const _customer$ = useContext(CustomerContext);
  return (
    <div>
      <InputWithLabel
        label="Nama"
        inputProps={{
          defaultValue: customer$[_customer$.customerId.get()]!.name.get(),
          onBlur: (e) =>
            customer$[_customer$.customerId.get()]!.name.set(e.target.value),
        }}
      />
      <InputWithLabel
        label="Alamat"
        inputProps={{
          defaultValue: customer$[_customer$.customerId.get()]!.address.get(),
          onBlur: (e) =>
            customer$[_customer$.customerId.get()]!.address.set(e.target.value),
        }}
      />
      <InputWithLabel
        label="Umur"
        inputProps={{
          type: "number",
          defaultValue: customer$[_customer$.customerId.get()]!.age.get(),
          onBlur: (e) =>
            customer$[_customer$.customerId.get()]!.age.set(+e.target.value),
        }}
      />
      <InputWithLabel
        label="Pekerjaan"
        inputProps={{
          defaultValue: customer$[_customer$.customerId.get()]!.job.get(),
          onBlur: (e) =>
            customer$[_customer$.customerId.get()]!.job.set(e.target.value),
        }}
      />
      <InputWithLabel
        label="Keterangan"
        inputProps={{
          defaultValue: customer$[_customer$.customerId.get()]!.notes.get(),
          onBlur: (e) =>
            customer$[_customer$.customerId.get()]!.notes.set(e.target.value),
        }}
      />
    </div>
  );
};
