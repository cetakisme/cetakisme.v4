"use client";

import RenderList from "@/components/hasan/render-list";
import { Button } from "@/components/ui/button";
import { type DB } from "@/lib/supabase/supabase";
import {
  generateId,
  productAttributeValue$,
  products$,
  productToAddons$,
  productVariants$,
} from "@/server/local/db";
import { asList } from "@/server/local/utils";
import { observer, use$, useMountOnce } from "@legendapp/state/react";
import Link from "next/link";
import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { dexie } from "@/server/local/dexie";
import { useTable } from "@/hooks/Table/useTable";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableSelectorHeader } from "@/hooks/Table/DataTableSelectorHeader";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { type ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Product } from "@prisma/client";
import Dialog from "@/components/hasan/dialog";
import DataTableAction from "@/hooks/Table/DataTableAction";
import { LucidePlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Title from "@/components/hasan/title";
import DataTableDeleteSelection from "@/hooks/Table/DataTableDeleteSelection";

const EditButton: React.FC<{ data: Product }> = ({ data }) => {
  return (
    <DropdownMenuItem asChild>
      <Link href={"/admin/katalog/produk/edit/" + data.id}>Ubah</Link>
    </DropdownMenuItem>
  );
};

const DeleteButton: React.FC<{ data: Product }> = ({ data }) => {
  return (
    <Dialog
      title="Apa Anda Yakin?"
      description={() => (
        <>
          Apa Anda Benar Benar Ingin Menghapus Produk Dengan Nama{" "}
          <span className="font-bold text-black">{data.name}</span>
        </>
      )}
      renderTrigger={() => <Button variant="destructive">Hapus Produk</Button>}
      renderCancel={() => <Button variant="outline">Tidak</Button>}
      renderAction={() => (
        <Button
          variant="destructive"
          onClick={() => {
            products$[data.id]!.deleted.set(true);
          }}
        >
          Ya
        </Button>
      )}
    ></Dialog>
  );
};

const ActiveSwtich: React.FC<{ data: Product }> = ({ data }) => {
  const handleOnChange = (v: boolean) => {
    products$[data.id]!.active.set(v);
  };
  return (
    <Switch onCheckedChange={handleOnChange} defaultChecked={data.active} />
  );
};

const columns: ColumnDef<Product>[] = [
  // DataTableSelectorHeader(),
  {
    id: "gambar",
    accessorFn: (original) => original.images[0] ?? "",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Gambar" />
    ),
    cell: ({ renderValue }) => {
      const url = renderValue<string>();
      return (
        <div className="relative flex aspect-square h-16 items-center justify-center">
          {url === "" ? (
            <>No Image</>
          ) : (
            <Image
              src={url}
              alt=""
              fill
              className="h-full w-full rounded-lg object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            />
          )}
        </div>
      );
    },
  },
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    size: 10000,
  },
  {
    id: "aktif",
    accessorKey: "active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) => <ActiveSwtich data={row.original} />,
  },
  DataTableAction({
    actions: [EditButton, DeleteButton],
  }),
];

const ProdukTable: React.FC<{ products?: Product[] }> = ({ products }) => {
  const data = React.useMemo(() => products ?? [], [products]);
  const table = useTable({
    columns: columns,
    data: data,
  });

  return (
    <div className="relative isolate space-y-2">
      <div className="sticky top-0 z-50 bg-white pb-2">
        <Title>Produk</Title>
        <div className="flex h-9 justify-between">
          <DataTableFilterName table={table} />
          <div className="flex gap-2">
            {/* <DataTableDeleteSelection
              onDelete={(rows) => {
                for (const element of rows) {
                  products$[element.original.id]!.deleted.set(true);
                }
              }}
              table={table}
            /> */}
            <Button
              variant="outline"
              onClick={() => {
                const id = generateId();
                products$[id]!.set({
                  id: id,
                  name: "Produk Baru",
                  active: true,
                  deleted: false,
                  base_price: 0,
                  images: ["", "", "", "", ""],
                  created_at: new Date().toISOString(),
                });
              }}
            >
              <LucidePlus />
            </Button>
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </div>
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
};

const Table = () => {
  const products = use$(products$.get());

  useMountOnce(() => {
    console.log(productVariants$.get());
    console.log(productAttributeValue$.get());
    console.log(productToAddons$.get());
  });

  return (
    <ProdukTable
      products={asList<Product>(products).filter((x) => !x.deleted)}
    />
  );
};

export default observer(Table);
