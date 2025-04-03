"use client";

import { Button } from "@/components/ui/button";
import { generateId, products$, productVariants$ } from "@/server/local/db";
import { observer } from "@legendapp/state/react";
import Link from "next/link";
import React from "react";
import { useTable } from "@/hooks/Table/useTable";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import { type ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { type Product } from "@prisma/client";
import Dialog from "@/components/hasan/dialog";
import DataTableAction from "@/hooks/Table/DataTableAction";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import Title from "@/components/hasan/title";
import { useLiveQuery } from "dexie-react-hooks";
import { dexie } from "@/server/local/dexie";
import Authenticated from "@/components/hasan/auth/authenticated";
import { toRupiah } from "@/lib/utils";
import Alert from "@/components/hasan/alert";
import { useDialog } from "@/hooks/useDialog";
import Sheet from "@/components/hasan/sheet";
import {
  TableHead,
  TableHeader,
  Table as T,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { List } from "@/components/hasan/render-list";
import { DialogProps } from "@radix-ui/react-dialog";

const EditButton: React.FC<{ data: Product }> = ({ data }) => {
  return (
    <Authenticated permission="produk-update">
      <DropdownMenuItem asChild>
        <Link href={"/admin/katalog/produk/edit/" + data.id}>Ubah</Link>
      </DropdownMenuItem>
    </Authenticated>
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
    id: "hpp",
    accessorKey: "costOfGoods",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="HPP Rata-Rata" />
    ),
    cell: ({ row }) => <HPP product={row.original} />,
  },
  {
    id: "aktif",
    accessorKey: "active",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Active" />
    ),
    cell: ({ row }) => (
      <Authenticated
        permission="produk-update"
        fallback={() => (
          <Switch defaultChecked={row.original.active} disabled />
        )}
      >
        <ActiveSwtich data={row.original} />
      </Authenticated>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions product={row.original} />,
  },
  // DataTableAction({
  //   actions: [EditButton, DeleteButton],
  // }),
];

const Actions: React.FC<{ product: Product }> = ({ product }) => {
  const deleteDialog = useDialog();
  const detailSheet = useDialog();
  const qtyDialog = useDialog();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="font-medium">Opsi</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => detailSheet.trigger()}>
            HPP Varian
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => qtyDialog.trigger()}>
            Qty Varian
          </DropdownMenuItem>
          <EditButton data={product} />
          <Authenticated permission="produk-delete">
            <Button asChild variant="destructive">
              <DropdownMenuItem
                className="w-full justify-start"
                onClick={() => deleteDialog.trigger()}
              >
                Hapus
              </DropdownMenuItem>
            </Button>
          </Authenticated>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet
        {...qtyDialog.props}
        title="Qty Varian"
        content={() => <QtyVarian product={product} />}
      />
      <Sheet
        {...detailSheet.props}
        title="HPP Varian"
        content={() => <HPPVarian product={product} />}
      />
      <Alert
        {...deleteDialog.props}
        title="Apa Anda Yakin?"
        description={`Apa Anda Benar Benar Ingin Menghapus Produk Dengan Nama ${product.name}`}
        renderCancel={() => <Button variant="outline">Tidak</Button>}
        renderAction={() => (
          <Button
            variant="destructive"
            onClick={() => {
              products$[product.id]!.deleted.set(true);
            }}
          >
            Ya
          </Button>
        )}
      />
    </>
  );
};

const useProductMeanHpp = (product: Product) => {
  const variants = useLiveQuery(() =>
    dexie.productVariants.where("product_id").equals(product.id).toArray(),
  );
  const variantsWithCost = variants?.filter((x) => x.costOfGoods !== 0) ?? [];

  const hpp = variantsWithCost.reduce((sum, a) => sum + a.costOfGoods, 0) ?? 0;

  if (variantsWithCost.length === 0) return toRupiah(0);

  return toRupiah(hpp / variantsWithCost.length);
};

const QtyVarian: React.FC<{ product: Product }> = ({ product }) => {
  const variants = useLiveQuery(() =>
    dexie.productVariants.where("product_id").equals(product.id).sortBy("name"),
  );

  return (
    <T>
      <TableHeader>
        <TableRow>
          <TableHead>Varian</TableHead>
          <TableHead>Qty</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <List
          data={variants}
          render={(data) => (
            <TableRow>
              <TableCell className="font-medium">{data.name}</TableCell>
              <TableCell>{data.qty}</TableCell>
            </TableRow>
          )}
        />
      </TableBody>
    </T>
  );
};

const HPPVarian: React.FC<{ product: Product }> = ({ product }) => {
  const variants = useLiveQuery(() =>
    dexie.productVariants.where("product_id").equals(product.id).sortBy("name"),
  );
  return (
    <T>
      <TableHeader>
        <TableRow>
          <TableHead>Varian</TableHead>
          <TableHead>HPP</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <List
          data={variants}
          render={(data) => (
            <TableRow>
              <TableCell className="font-medium">{data.name}</TableCell>
              <TableCell>
                {data.costOfGoods === 0
                  ? toRupiah(product.costOfGoods)
                  : toRupiah(data.costOfGoods)}
              </TableCell>
            </TableRow>
          )}
        />
      </TableBody>
    </T>
  );
};

const HPP: React.FC<{ product: Product }> = ({ product }) => {
  const productHpp = useProductMeanHpp(product);
  return productHpp;
};

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
            <Authenticated permission="produk-create">
              <Button
                size="icon"
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
                    description: "",
                    costOfGoods: 0,
                  });
                }}
              >
                <LucidePlus />
              </Button>
            </Authenticated>
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
  const products = useLiveQuery(() =>
    dexie.products
      .filter((x) => x.deleted === false)
      .reverse()
      .sortBy("created_at"),
  );
  return <ProdukTable products={products} />;
};

export default observer(Table);
