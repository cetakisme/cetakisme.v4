"use client";

import Alert from "@/components/hasan/alert";
import Authenticated from "@/components/hasan/auth/authenticated";
import ControlledSheet from "@/components/hasan/controlled-sheet";
import InputWithLabel from "@/components/hasan/input-with-label";
import Sheet from "@/components/hasan/sheet";
import Title from "@/components/hasan/title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { useTable } from "@/hooks/Table/useTable";
import { useDialog } from "@/hooks/useDialog";
import { generateId, materials$ } from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import type { Observable } from "@legendapp/state";
import { Memo, useObservable } from "@legendapp/state/react";
import type { Material } from "@prisma/client";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import type { ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import React, { createContext, useContext } from "react";

interface IBahanContext {
  id: string;
}
const BahanContext = createContext<Observable<IBahanContext>>(undefined as any);

const Page = () => {
  return (
    <Authenticated permission="bahan-dan-aset">
      <Table />
    </Authenticated>
  );
};

export default Page;

const columns: ColumnDef<Material>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ renderValue }) => (
      <div className="font-medium">{renderValue<string>()}</div>
    ),
  },
  {
    id: "tipe",
    accessorKey: "aset",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe" />
    ),
    cell: ({ row }) => <Badge>{row.original.aset ? "Aset" : "Bahan"}</Badge>,
  },
  {
    id: "qty",
    accessorKey: "qty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty" />
    ),
    cell: ({ row }) =>
      row.original.aset ? "-" : row.original.qty + " " + row.original.unit,
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions bahan={row.original} />,
  },
];

type C_Bahan = React.FC<{ bahan: Material }>;

const Actions: C_Bahan = ({ bahan }) => {
  const ctx$ = useContext(BahanContext);
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
          <DropdownMenuItem className="font-semibold">Opsi</DropdownMenuItem>
          <DropdownMenuSeparator />
          <Memo>
            {() => (
              <DropdownMenuItem
                onClick={() => {
                  ctx$.id.set(bahan.id);
                  editDialog.trigger();
                }}
              >
                Ubah
              </DropdownMenuItem>
            )}
          </Memo>
          <Button
            variant="destructive"
            className="w-full justify-start"
            asChild
          >
            <DropdownMenuItem onClick={deleteDialog.trigger}>
              Hapus
            </DropdownMenuItem>
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet title="Bahan" content={() => <Form />} {...editDialog.props} />
      <Alert
        {...deleteDialog.props}
        title="Yakin Ingin Menghapus Bahan ?"
        description="Barang yang dihapus tidak bisa dikembalikan lagi"
        renderCancel={() => <Button>Tidak</Button>}
        renderAction={() => (
          <Button onClick={() => materials$[bahan.id]!.delete()}>Ya</Button>
        )}
      />
    </>
  );
};

const Table = () => {
  const value$ = useObservable<IBahanContext>({ id: "" });

  const data = useLiveQuery(() =>
    dexie.materials.filter((x) => !x.deleted).toArray(),
  );

  const table = useTable({
    data: data ?? [],
    columns: columns,
  });

  return (
    <BahanContext.Provider value={value$}>
      <ScrollArea className="h-screen p-8">
        <Title>Bahan Dan Aset</Title>
        <div className="space-y-2">
          <div className="flex h-9 justify-between">
            <DataTableFilterName table={table} />
            <div className="flex gap-2">
              <AddSheet />
              <DataTableViewOptions table={table} />
            </div>
          </div>
          <DataTableContent table={table} />
          <DataTablePagination table={table} />
        </div>
      </ScrollArea>
    </BahanContext.Provider>
  );
};

const AddSheet = () => {
  const ctx$ = useContext(BahanContext);
  return (
    <ControlledSheet
      title="Bahan"
      trigger={(open) => (
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const id = generateId();
            const newBahan = {
              id: id,
              deleted: false,
              name: "Bahan Baru",
              qty: 0,
              unit: "Buah",
              aset: false,
            };
            materials$[id]!.set(newBahan);
            ctx$.id.set(id);
            open();
          }}
        >
          <LucidePlus />
        </Button>
      )}
      content={() => <Form />}
    />
  );
};

const Form = () => {
  const ctx$ = useContext(BahanContext);
  return (
    <div className="space-y-2">
      <Memo>
        {() => (
          <InputWithLabel
            label="Nama"
            inputProps={{
              defaultValue: materials$[ctx$.id.get()]!.name.get(),
              onBlur: (e) =>
                materials$[ctx$.id.get()]!.name.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <div className="flex items-center gap-2">
            <Label>Aset</Label>
            <Checkbox
              checked={materials$[ctx$.id.get()]!.aset.get()}
              onCheckedChange={(e) =>
                materials$[ctx$.id.get()]!.aset.set(e === true ? true : false)
              }
            />
          </div>
        )}
      </Memo>
      <Memo>
        {() => {
          const show = materials$[ctx$.id.get()]!.aset.get();
          if (show) return;
          return (
            <InputWithLabel
              label="Unit"
              inputProps={{
                defaultValue: materials$[ctx$.id.get()]!.unit.get(),
                onBlur: (e) =>
                  materials$[ctx$.id.get()]!.unit.set(e.target.value),
              }}
            />
          );
        }}
      </Memo>
      <Memo>
        {() => {
          const show = materials$[ctx$.id.get()]!.aset.get();
          if (show) return;
          return (
            <InputWithLabel
              label="Qty"
              inputProps={{
                defaultValue: materials$[ctx$.id.get()]!.qty.get(),
                onBlur: (e) =>
                  materials$[ctx$.id.get()]!.qty.set(+e.target.value),
              }}
            />
          );
        }}
      </Memo>
    </div>
  );
};
