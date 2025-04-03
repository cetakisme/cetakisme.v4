"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Authenticated from "@/components/hasan/auth/authenticated";
import React, { createContext, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { dexie } from "@/server/local/dexie";
import { useTable } from "@/hooks/Table/useTable";
import { ColumnDef } from "@tanstack/react-table";
import Title from "@/components/hasan/title";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { z } from "zod";
import {
  expenses$,
  ingoingStockTypes$,
  materials$,
  orderMaterials$,
  orderProducts$,
  products$,
  productVariants$,
  suppliers$,
} from "@/server/local/db";
import {
  IngoingStockType,
  Material,
  OrderMaterial,
  OrderProduct,
  Product,
  ProductVariant,
  Supplier,
} from "@prisma/client";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import {
  Memo,
  useMount,
  useObservable,
  useObserveEffect,
} from "@legendapp/state/react";
import Sheet from "@/components/hasan/sheet";
import InputWithLabel from "@/components/hasan/input-with-label";
import { Combobox } from "@/components/hasan/combobox";
import { Button } from "@/components/ui/button";
import { LucidePlus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { DialogProps } from "@radix-ui/react-dialog";
import { generateId } from "better-auth";
import { useDialog } from "@/hooks/useDialog";
import { SheetClose } from "@/components/ui/sheet";
import { DateTime } from "luxon";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Observable } from "@legendapp/state";
import Alert from "@/components/hasan/alert";
import ControlledSheet from "@/components/hasan/controlled-sheet";
import Dexie from "dexie";
import { DB } from "@/lib/supabase/supabase";
import { now } from "@/lib/utils";
import Conditional from "@/components/hasan/conditional";

const Page = () => {
  return (
    <Authenticated permission="inventory">
      <Inventory />
    </Authenticated>
  );
};

export default Page;

const Inventory = () => {
  return (
    <ScrollArea className="h-screen p-8">
      <Tabs defaultValue="stok-masuk">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stok-masuk">Stok Masuk</TabsTrigger>
          <TabsTrigger value="stok-keluar">Stok Keluar</TabsTrigger>
        </TabsList>
        <TabsContent value="stok-masuk">
          <StokMasuk />
        </TabsContent>
        <TabsContent value="stok-keluar">
          <StokKeluar />
        </TabsContent>
      </Tabs>
    </ScrollArea>
  );
};

type StokMasukType = {
  id: string;
  qty: number;
  name: string;
  createdAt: Date;
  type: string;
  paid: number;
};

const stockMasukColumn: ColumnDef<StokMasukType>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    id: "type",
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe" />
    ),
    cell: ({ row }) => <Badge>{row.original.type}</Badge>,
  },
  {
    id: "qty",
    accessorKey: "qty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty" />
    ),
  },
  {
    id: "action",
    cell: ({ row }) => <Actions data={row.original} />,
  },
];

interface IStokMasukContext {
  id: string;
}

const Actions: React.FC<{ data: StokMasukType }> = ({ data }) => {
  const deleteDialog = useDialog();
  const editDialog = useDialog();

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
          <DropdownMenuItem
            onClick={() => {
              editDialog.trigger();
            }}
          >
            Ubah
          </DropdownMenuItem>
          <Button asChild variant="destructive">
            <DropdownMenuItem
              className="w-full justify-start"
              onClick={() => {
                deleteDialog.trigger();
              }}
            >
              Hapus
            </DropdownMenuItem>
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
      <StokMasukEdit
        stokMasuk={data}
        {...editDialog.props}
        onSubmit={editDialog.dismiss}
      />
      <Alert
        {...deleteDialog.props}
        title="Yakin Ingin Menghapus Stok Masuk?"
        description="Stok yang telah dihapus tidak dapat dikembalikan lagi"
        renderCancel={() => <Button>Tidak</Button>}
        renderAction={() => (
          <Button
            onClick={() => {
              if (data.type === "Produk") {
                orderProducts$[data.id]!.delete();
              }

              if (data.type === "Bahan") {
                orderProducts$[data.id]!.delete();
              }

              expenses$[data.id]!.delete();
            }}
          >
            Ya
          </Button>
        )}
      />
    </>
  );
};

const StokMasukEdit: React.FC<
  { stokMasuk: StokMasukType; onSubmit: () => void } & DialogProps
> = ({ stokMasuk, onSubmit, ...props }) => {
  return (
    <Sheet
      {...props}
      title="Stok Masuk"
      content={() => (
        <StokMasukEditContent stokMasuk={stokMasuk} onSubmit={onSubmit} />
      )}
    />
  );
};

const StokMasukEditContent: React.FC<{
  stokMasuk: StokMasukType;
  onSubmit: () => void;
}> = ({ stokMasuk, onSubmit }) => {
  const stok = useObservable<OrderProduct>({
    createdAt: new Date(),
    id: "",
    qty: 0,
    type: "inventory",
    deleted: false,
    inOut: "in",
    orderId: "",
    pay: 0,
    productId: "",
    supplierId: "",
    variantId: "",
  });

  useMount(async () => {
    const order = await dexie.orderProducts.get(stokMasuk.id);
    if (!order) return;
    stok.set(order);
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        <Label>Produk</Label>
        <Memo>
          {() => {
            const id = stok.productId.get();
            return (
              <ProductSelector
                key={id}
                selected={products$[id]!.name.get()}
                onSelected={(e) => {
                  stok.productId.set(e.id);
                }}
              />
            );
          }}
        </Memo>
      </div>
      <Memo>
        {() => {
          const id = stok.productId.get();

          if (id === "") return;

          return (
            <>
              <div className="flex flex-col gap-2">
                <Label>Varian</Label>
                <VariantSelector
                  key={id}
                  selected={productVariants$[stok.variantId.get()]!.name.get()}
                  onSelected={(e) => stok.variantId.set(e.id)}
                  productId={id}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Suplier</Label>
                <SuplierSelector
                  selected={suppliers$[stok.supplierId.get()]!.name.get()}
                  onSelected={(e) => stok.supplierId.set(e.id)}
                />
              </div>
              <Memo>
                {() => (
                  <InputWithLabel
                    label="Qty"
                    inputProps={{
                      defaultValue: stok.qty.get(),
                      onBlur: (e) => stok.qty.set(+e.target.value),
                    }}
                  />
                )}
              </Memo>
              <Memo>
                {() => (
                  <InputWithLabel
                    label="Bayar"
                    inputProps={{
                      defaultValue: stok.pay.get(),
                      onBlur: (e) => stok.pay.set(+e.target.value),
                    }}
                  />
                )}
              </Memo>
            </>
          );
        }}
      </Memo>
      <Button
        className="w-full"
        onClick={async () => {
          const result = stokSchema.safeParse(stok.get());
          if (!result.success) {
            toast.error(result.error.errors[0]!.message);
            return;
          }

          const id = stok.id.get();
          orderProducts$[id]!.set((p) => ({
            ...stok.get(),
            createdAt: p.createdAt,
          }));

          const order = await dexie.orderProducts.get(stokMasuk.id);

          productVariants$[stok.variantId.get()]!.qty.set(
            (p) => p + order!.qty - stok.qty.get(),
          );

          const pastOrder = await dexie.orderProducts
            .where("[variantId+createdAt]")
            .between(
              [stok.variantId.get(), Dexie.minKey],
              [stok.variantId.get(), Dexie.maxKey],
            )
            .filter((s) => s.inOut === "in")
            .reverse()
            .limit(20)
            .toArray();

          let pastHpp = 0;

          if (pastOrder.length !== 0) {
            pastHpp =
              pastOrder.reduce((sum, x) => {
                if (x.id !== stok.id.get()) {
                  return sum + x.pay / x.qty;
                } else {
                  return sum + stok.pay.get() / stok.qty.get();
                }
              }, 0) / pastOrder.length;
          }

          expenses$[id]!.set((p) => ({
            ...p,
            expense: stok.pay.get(),
            notes: `Beli ${stok.qty.get()} ${products$[stok.productId.get()]!.name.get()} ${productVariants$[stok.variantId.get()]!.name.get()} Di ${suppliers$[stok.supplierId.get()]!.name.get()}`,
            updatedAt: DateTime.now().setZone("Asia/Singapore").toISO()!,
            targetId: stok.id.get(),
          }));

          productVariants$[stok.variantId.get()]!.costOfGoods.set(pastHpp);

          onSubmit();
        }}
      >
        Simpan
      </Button>
    </div>
  );
};

const StokMasuk = () => {
  const products = useLiveQuery(() =>
    dexie.orderProducts
      .where("type")
      .notEqual("vendor")
      .and((x) => !x.deleted && x.inOut === "in")
      .toArray(),
  );
  const bahan = useLiveQuery(() =>
    dexie.orderMaterials
      .where("type")
      .notEqual("vendor")
      .and((x) => !x.deleted && x.inOut === "in")
      .toArray(),
  );

  const combined: StokMasukType[] = [
    ...(products?.map((x) => ({
      id: x.id,
      qty: x.qty,
      name: getVariantName(x),
      createdAt: x.createdAt,
      type: "Produk",
      paid: x.pay,
    })) ?? []),
    ...(bahan?.map((x) => ({
      id: x.id,
      qty: x.qty,
      name: materials$[x.materialId]!.name.get(),
      createdAt: x.createdAt,
      type: "Bahan",
      paid: x.pay,
    })) ?? []),
  ];

  const table = useTable({
    data: combined.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    columns: stockMasukColumn,
  });

  return (
    <>
      <Title>Stok Masuk</Title>
      <div className="space-y-2 p-1">
        <div className="flex h-9 justify-between">
          <DataTableFilterName table={table} />
          <div className="flex gap-2">
            <AddStokSheet />
            <DataTableViewOptions table={table} />
          </div>
        </div>
        <DataTableContent table={table} />
        <DataTablePagination table={table} />
      </div>
    </>
  );
};

const materialSchema = z.object({
  materialId: z.string().min(1, "Masukan Material Dahulu"),
  supplierId: z.string().min(1, "Masukan Suplier Dahulu"),
  qty: z.number().min(1, "Masukan Qty Dahulu"),
  pay: z.number().min(1, "Masukan Harga Bayar Dahulu"),
});

const stokSchema = z.object({
  productId: z.string().min(1, "Masukan Produk Dahulu"),
  variantId: z.string().min(1, "Masukan Varian Dahulu"),
  supplierId: z.string().min(1, "Masukan Suplier Dahulu"),
  qty: z.number().min(1, "Masukan Qty Dahulu"),
  pay: z.number().min(1, "Masukan Harga Bayar Dahulu"),
});

const AddStokSheet = () => {
  return (
    <ControlledSheet
      title="Stok Masuk"
      trigger={(trigger) => (
        <Button variant="outline" size="icon" onClick={trigger}>
          <LucidePlus />
        </Button>
      )}
      content={(dissmiss) => (
        <div className="space-y-2">
          <Tabs defaultValue="produk">
            <TabsList className="w-full">
              <TabsTrigger value="produk" className="w-full">
                Produk
              </TabsTrigger>
              <TabsTrigger value="bahan" className="w-full">
                Bahan
              </TabsTrigger>
              {/* <TabsTrigger value="lain" className="w-full">
                Lainnya
              </TabsTrigger> */}
            </TabsList>
            <TabsContent value="produk">
              <AddProductForm onSubmit={dissmiss} />
            </TabsContent>
            <TabsContent value="bahan">
              <AddMaterialForm onSubmit={dissmiss} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    />
  );
};

const AddMaterialForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  const stok = useObservable<OrderMaterial>({
    createdAt: new Date(),
    id: "",
    qty: 0,
    type: "inventory",
    deleted: false,
    inOut: "in",
    orderId: "",
    pay: 0,
    materialId: "",
    supplierId: "",
  });

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        <Label>Material</Label>

        <MaterialSelector
          onSelected={(e) => {
            stok.materialId.set(e.id);
          }}
        />
      </div>
      <Memo>
        {() => {
          const id = stok.materialId.get();

          if (id === "") return;

          return (
            <>
              <div className="flex flex-col gap-2">
                <Label>Suplier</Label>
                <SuplierSelector
                  onSelected={(e) => stok.supplierId.set(e.id)}
                />
              </div>
              <InputWithLabel
                label="Qty"
                inputProps={{
                  onBlur: (e) => stok.qty.set(+e.target.value),
                }}
              />
              <InputWithLabel
                label="Bayar"
                inputProps={{
                  onBlur: (e) => stok.pay.set(+e.target.value),
                }}
              />
            </>
          );
        }}
      </Memo>
      <Button
        className="w-full"
        onClick={async () => {
          const result = materialSchema.safeParse(stok.get());
          if (!result.success) {
            toast.error(result.error.errors[0]!.message);
            return;
          }

          const id = generateId();
          stok.id.set(id);
          orderMaterials$[id]!.set({
            ...stok.get(),
            createdAt: DateTime.now().setZone("Asia/Singapore").toISO()!,
          });

          materials$[stok.materialId.get()]!.qty.set((p) => p + stok.qty.get());

          const hpp = stok.pay.get() / stok.qty.get();

          const pastOrder = await dexie.orderMaterials
            .where("[materialId+createdAt]")
            .between(
              [stok.materialId.get(), Dexie.minKey],
              [stok.materialId.get(), Dexie.maxKey],
            )
            .filter((s) => s.inOut === "in")
            .limit(10)
            .toArray();

          let pastHpp = 0;

          if (pastOrder.length !== 0) {
            pastHpp =
              pastOrder.reduce((sum, x) => sum + x.pay / x.qty, 0) /
              pastOrder.length;
          }

          expenses$[id]!.set({
            id: id,
            createdAt: DateTime.now().setZone("Asia/Singapore").toISO()!,
            deleted: false,
            expense: stok.pay.get(),
            notes: `Beli ${stok.qty.get()} ${materials$[stok.materialId.get()]!.name.get()} Di ${suppliers$[stok.supplierId.get()]!.name.get()}`,
            type: "bahan",
            updatedAt: DateTime.now().setZone("Asia/Singapore").toISO()!,
            targetId: stok.id.get(),
          });

          materials$[stok.materialId.get()]!.costOfGoods.set((p) => {
            if (pastHpp === 0) return hpp;
            return (pastHpp + hpp) / 2;
          });

          onSubmit();
        }}
      >
        Submit
      </Button>
    </div>
  );
};

const AddProductForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  const stok = useObservable<OrderProduct>({
    createdAt: new Date(),
    id: "",
    qty: 0,
    type: "inventory",
    deleted: false,
    inOut: "in",
    orderId: "",
    pay: 0,
    productId: "",
    supplierId: "",
    variantId: "",
  });
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        <Label>Produk</Label>

        <ProductSelector
          onSelected={(e) => {
            stok.productId.set(e.id);
          }}
        />
      </div>
      <Memo>
        {() => {
          const id = stok.productId.get();

          if (id === "") return;

          return (
            <>
              <div className="flex flex-col gap-2">
                <Label>Varian</Label>
                <VariantSelector
                  key={id}
                  onSelected={(e) => stok.variantId.set(e.id)}
                  productId={id}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Suplier</Label>
                <SuplierSelector
                  onSelected={(e) => stok.supplierId.set(e.id)}
                />
              </div>
              <InputWithLabel
                label="Qty"
                inputProps={{
                  onBlur: (e) => stok.qty.set(+e.target.value),
                }}
              />
              <InputWithLabel
                label="Bayar"
                inputProps={{
                  onBlur: (e) => stok.pay.set(+e.target.value),
                }}
              />
            </>
          );
        }}
      </Memo>
      <Button
        className="w-full"
        onClick={async () => {
          const result = stokSchema.safeParse(stok.get());
          if (!result.success) {
            toast.error(result.error.errors[0]!.message);
            return;
          }

          const id = generateId();
          stok.id.set(id);
          orderProducts$[id]!.set({
            ...stok.get(),
            createdAt: DateTime.now().setZone("Asia/Singapore").toISO()!,
          });
          productVariants$[stok.variantId.get()]!.qty.set(
            (p) => p + stok.qty.get(),
          );

          const hpp = stok.pay.get() / stok.qty.get();

          const pastOrder = await dexie.orderProducts
            .where("[variantId+createdAt]")
            .between(
              [stok.variantId.get(), Dexie.minKey],
              [stok.variantId.get(), Dexie.maxKey],
            )
            .filter((s) => s.inOut === "in")
            .limit(10)
            .toArray();

          let pastHpp = 0;

          if (pastOrder.length !== 0) {
            pastHpp =
              pastOrder.reduce((sum, x) => sum + x.pay / x.qty, 0) /
              pastOrder.length;
          }

          expenses$[id]!.set({
            id: id,
            createdAt: DateTime.now().setZone("Asia/Singapore").toISO()!,
            deleted: false,
            expense: stok.pay.get(),
            notes: `Beli ${stok.qty.get()} ${products$[stok.productId.get()]!.name.get()} ${productVariants$[stok.variantId.get()]!.name.get()} Di ${suppliers$[stok.supplierId.get()]!.name.get()}`,
            type: "produk",
            updatedAt: DateTime.now().setZone("Asia/Singapore").toISO()!,
            targetId: stok.id.get(),
          });

          productVariants$[stok.variantId.get()]!.costOfGoods.set((p) => {
            if (pastHpp === 0) return hpp;
            return (pastHpp + hpp) / 2;
          });

          onSubmit();
        }}
      >
        Submit
      </Button>
    </div>
  );
};

const SuplierSelector: React.FC<{
  selected?: string;
  onSelected: (e: Supplier) => void;
}> = ({ selected, onSelected }) => {
  const supplier = useLiveQuery(() =>
    dexie.suppliers.filter((x) => !x.deleted).sortBy("name"),
  );

  const [variant, setVariant] = React.useState(selected ?? "Pilih Suplier");

  const addDialog = useDialog();

  return (
    <>
      <Combobox
        title="Order Produk"
        onSelected={(e) => {
          setVariant(e.name);
          onSelected(e);
        }}
        data={supplier ?? []}
        renderItem={(data) => data.name}
        renderSelected={() => variant}
        renderAddButton={() => (
          <div className="p-1">
            <Button onClick={() => addDialog.trigger()} className="w-full">
              <LucidePlus /> Buat Supplier Baru
            </Button>
          </div>
        )}
      />
      <SuplierForm
        onSubmit={(e) => {
          onSelected(e);
          addDialog.dismiss();
        }}
        {...addDialog.props}
      />
    </>
  );
};

const SuplierForm: React.FC<
  { onSubmit: (e: Supplier) => void } & DialogProps
> = ({ onSubmit, ...props }) => {
  const name = useObservable("");
  return (
    <Sheet
      {...props}
      title="Suplier"
      content={() => (
        <div className="space-y-2">
          <Memo>
            {() => (
              <InputWithLabel
                label="Nama"
                inputProps={{
                  value: name.get(),
                  onChange: (e) => name.set(e.target.value),
                }}
              />
            )}
          </Memo>
          <Button
            onClick={() => {
              if (name.get() === "") {
                toast.error("Nama Harus Diisi");
                return;
              }

              const id = generateId();
              const supplier: Supplier = {
                id: id,
                name: name.get(),
                address: "",
                deleted: false,
                notes: "",
                phone: "",
              };
              suppliers$[id]!.set(supplier);
              onSubmit(supplier);
            }}
          >
            Buat Suplier Baru
          </Button>
        </div>
      )}
    />
  );
};

const VariantSelector: React.FC<{
  selected?: string;
  onSelected: (e: ProductVariant) => void;
  productId: string;
}> = ({ selected, onSelected, productId }) => {
  const variants = useLiveQuery(() =>
    dexie.productVariants
      .where("product_id")
      .equals(productId)
      .and((x) => !x.deleted)
      .sortBy("name"),
  );

  const [variant, setVariant] = React.useState(selected ?? "Pilih Varian");

  return (
    <Combobox
      title="Order Produk"
      onSelected={(e) => {
        setVariant(e.name);
        onSelected(e);
      }}
      data={variants ?? []}
      renderItem={(data) => data.name}
      renderSelected={() => variant}
    />
  );
};

const ProductSelector: React.FC<{
  selected?: string;
  onSelected: (e: Product) => void;
}> = ({ selected, onSelected }) => {
  const products = useLiveQuery(() =>
    dexie.products.filter((x) => !x.deleted).sortBy("name"),
  );

  const [product, setProduct] = React.useState<string>(
    selected ?? "Pilih Produk",
  );

  return (
    <Combobox
      title="Produk"
      onSelected={(e) => {
        setProduct(e.name);
        onSelected(e);
      }}
      data={products ?? []}
      renderItem={(data) => data.name}
      renderSelected={() => product}
    />
  );
};

const MaterialSelector: React.FC<{
  selected?: string;
  onSelected: (e: Material) => void;
}> = ({ selected, onSelected }) => {
  const materials = useLiveQuery(() =>
    dexie.materials.filter((x) => !x.deleted).sortBy("name"),
  );

  const [material, setMaterial] = React.useState<string>(
    selected ?? "Pilih Material",
  );

  return (
    <Combobox
      title="Material"
      onSelected={(e) => {
        setMaterial(e.name);
        onSelected(e);
      }}
      data={materials ?? []}
      renderItem={(data) => data.name}
      renderSelected={() => material}
    />
  );
};

type StokKeluarType = {
  id: string;
  qty: number;
  name: string;
  createdAt: Date;
  type: string;
};

const stockKeluarColumn: ColumnDef<StokKeluarType>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    id: "type",
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe" />
    ),
    cell: ({ row }) => <Badge>{row.original.type}</Badge>,
  },
  {
    id: "qty",
    accessorKey: "qty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty" />
    ),
  },
  {
    id: "action",
    cell: ({ row }) => <KeluarActions stok={row.original} />,
  },
];

const KeluarActions: React.FC<{ stok: StokKeluarType }> = ({ stok }) => {
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
        <DropdownMenuContent className="space-y-1">
          <DropdownMenuItem className="font-medium">Opsi</DropdownMenuItem>
          <Conditional condition={!stok.type.includes("inventory")}>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={editDialog.trigger}>
              Ubah
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={deleteDialog.trigger}
              >
                Hapus
              </Button>
            </DropdownMenuItem>
          </Conditional>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet
        {...editDialog.props}
        title="Edit Stok Masuk"
        content={() => {
          if (stok.type.includes("produk")) {
            const orderProduct = orderProducts$[stok.id]!.get();
            return (
              <AddStockMasukProductForm
                onSubmit={editDialog.dismiss}
                stokKeluar={orderProduct}
              />
            );
          }

          if (stok.type.includes("bahan")) {
            const orderMaterial = orderMaterials$[stok.id]!.get();
            return (
              <AddStockMaterialForm
                onSubmit={editDialog.dismiss}
                material={orderMaterial}
              />
            );
          }
        }}
      />
      <Alert
        {...deleteDialog.props}
        title="Yakin Ingin Menghapus Data?"
        description="Data Yang Dihapus Tidak Dapat Dikembalikan"
        renderCancel={() => <Button>Tidak</Button>}
        renderAction={() => (
          <Button
            onClick={() => {
              if (stok.type.includes("produk")) {
                orderProducts$[stok.id]!.delete();
                return;
              }

              if (stok.type.includes("bahan")) {
                orderMaterials$[stok.id]!.delete();
                return;
              }
            }}
          >
            Ya
          </Button>
        )}
      />
    </>
  );
};

const getVariantName = (p: OrderProduct) => {
  const variant = productVariants$[p.variantId]?.get();
  const product = products$[p.productId]?.get();

  if (!variant || !product) return "No Name";
  return `${product.name} ${variant.name}`;
};

const StokKeluar = () => {
  const products = useLiveQuery(() =>
    dexie.orderProducts
      .where("type")
      .notEqual("vendor")
      .and((x) => !x.deleted && x.inOut === "out")
      .toArray(),
  );
  const bahan = useLiveQuery(() =>
    dexie.orderMaterials
      .where("type")
      .notEqual("vendor")
      .and((x) => !x.deleted && x.inOut === "out")
      .toArray(),
  );

  const combined: StokKeluarType[] = [
    ...(products?.map((x) => ({
      id: x.id,
      qty: x.qty,
      name: getVariantName(x),
      createdAt: x.createdAt,
      type: x.type + " - produk",
    })) ?? []),
    ...(bahan?.map((x) => ({
      id: x.id,
      qty: x.qty,
      name: materials$[x.materialId]!.name.get(),
      createdAt: x.createdAt,
      type: x.type + " - bahan",
    })) ?? []),
  ];

  const table = useTable({
    data: combined.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    columns: stockKeluarColumn,
  });

  return (
    <>
      <Title>Stok Keluar</Title>
      <div className="space-y-2 p-1">
        <div className="flex h-9 justify-between">
          <DataTableFilterName table={table} />
          <div className="flex gap-2">
            <StokKeluarAdd />
            <DataTableViewOptions table={table} />
          </div>
        </div>
        <DataTableContent table={table} />
        <DataTablePagination table={table} />
      </div>
    </>
  );
};

const StokKeluarAdd = () => {
  return (
    <ControlledSheet
      title="Stok Keluar"
      description="Barang Yang Keluar Lewat Form Ini Tidak Akan Mempengaruhi Pemasukan"
      trigger={(trigger) => (
        <Button variant="outline" size="icon" onClick={trigger}>
          <LucidePlus />
        </Button>
      )}
      content={(dismiss) => <StokKeluarAddForm onSubmit={dismiss} />}
    />
  );
};

const StokKeluarAddForm: React.FC<{
  onSubmit: () => void;
}> = ({ onSubmit }) => {
  return (
    <div className="space-y-2">
      <Tabs defaultValue="produk">
        <TabsList className="w-full">
          <TabsTrigger value="produk" className="w-full">
            Produk
          </TabsTrigger>
          <TabsTrigger value="bahan" className="w-full">
            Bahan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="produk">
          <AddStockMasukProductForm onSubmit={onSubmit} />
        </TabsContent>
        <TabsContent value="bahan">
          <AddStockMaterialForm onSubmit={onSubmit} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ingoingProductStockSchema = z.object({
  productId: z.string().min(1, "Masukan Product Dahulu"),
  type: z.string().min(1, "Masukan Tipe Dahulu"),
  variantId: z.string().min(1, "Masukan Varian Dahulu"),
  qty: z.number().min(1, "Masukan Qty Dahulu"),
});

const ingoingMaterialStockSchema = z.object({
  materialId: z.string().min(1, "Masukan Product Dahulu"),
  type: z.string().min(1, "Masukan Tipe Dahulu"),
  qty: z.number().min(1, "Masukan Qty Dahulu"),
});

const AddStockMasukProductForm: React.FC<{
  stokKeluar?: DB<"OrderProduct">;
  onSubmit: () => void;
}> = ({ stokKeluar, onSubmit }) => {
  const stok = useObservable<DB<"OrderProduct">>({
    createdAt: stokKeluar?.createdAt ?? now().toISO()!,
    id: stokKeluar?.id ?? generateId(),
    qty: stokKeluar?.qty ?? 0,
    type: stokKeluar?.type ?? "",
    deleted: false,
    inOut: "out",
    orderId: stokKeluar?.id ?? "",
    pay: stokKeluar?.pay ?? 0,
    productId: stokKeluar?.productId ?? "",
    supplierId: stokKeluar?.supplierId ?? "",
    variantId: stokKeluar?.variantId ?? "",
  });

  const types = useLiveQuery(() =>
    dexie.ingoingStockTypes.filter((x) => !x.deleted).toArray(),
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        <Label>Tipe</Label>
        <Combobox
          data={types ?? []}
          onSelected={(e) => stok.type.set(e.name)}
          renderItem={(e) => e.name}
          renderSelected={() => (
            <Memo>
              {() => (stok.type.get() === "" ? "Pilih Tipe" : stok.type.get())}
            </Memo>
          )}
          title="Tipe"
          renderAddButton={() => (
            <AddTypeSheet onSubmit={(e) => stok.type.set(e.name)} />
          )}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Produk</Label>
        <Memo>
          {() => (
            <ProductSelector
              selected={products$[stok.productId.get()]!.name.get()}
              onSelected={(e) => {
                stok.productId.set(e.id);
              }}
            />
          )}
        </Memo>
      </div>
      <Memo>
        {() => {
          const id = stok.productId.get();

          if (id === "") return;

          return (
            <>
              <div className="flex flex-col gap-2">
                <Label>Varian</Label>
                <VariantSelector
                  key={id}
                  selected={productVariants$[stok.variantId.get()]!.name.get()}
                  onSelected={(e) => stok.variantId.set(e.id)}
                  productId={id}
                />
              </div>
              <InputWithLabel
                label="Qty"
                inputProps={{
                  defaultValue: stok.qty.get(),
                  onBlur: (e) => stok.qty.set(+e.target.value),
                }}
              />
            </>
          );
        }}
      </Memo>
      <Button
        className="w-full"
        onClick={async () => {
          const result = ingoingProductStockSchema.safeParse(stok.get());
          if (!result.success) {
            toast.error(result.error.errors[0]!.message);
            return;
          }

          orderProducts$[stok.id.get()]!.set(stok.get());
          onSubmit();
        }}
      >
        Submit
      </Button>
    </div>
  );
};

const AddTypeSheet: React.FC<{ onSubmit: (e: IngoingStockType) => void }> = ({
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

const TypeSheetContent: React.FC<{
  onSubmit: (e: IngoingStockType) => void;
}> = ({ onSubmit }) => {
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

          ingoingStockTypes$[id]!.set(type);
          onSubmit(type);
        }}
      >
        Submit
      </Button>
    </div>
  );
};

const AddStockMaterialForm: React.FC<{
  material?: DB<"OrderMaterial">;
  onSubmit: () => void;
}> = ({ onSubmit, material }) => {
  const stok = useObservable<DB<"OrderMaterial">>({
    createdAt: material?.createdAt ?? now().toISO()!,
    id: material?.id ?? generateId(),
    qty: material?.qty ?? 0,
    type: material?.type ?? "",
    deleted: false,
    inOut: "out",
    orderId: material?.orderId ?? "",
    pay: material?.pay ?? 0,
    materialId: material?.materialId ?? "",
    supplierId: material?.supplierId ?? "",
  });

  const types = useLiveQuery(() =>
    dexie.ingoingStockTypes.filter((x) => !x.deleted).toArray(),
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        <Label>Tipe</Label>
        <Combobox
          data={types ?? []}
          onSelected={(e) => stok.type.set(e.name)}
          renderItem={(e) => e.name}
          renderSelected={() => (
            <Memo>
              {() => (stok.type.get() === "" ? "Pilih Tipe" : stok.type.get())}
            </Memo>
          )}
          title="Tipe"
          renderAddButton={() => (
            <AddTypeSheet onSubmit={(e) => stok.type.set(e.name)} />
          )}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Material</Label>
        <Memo>
          {() => (
            <MaterialSelector
              selected={materials$[stok.materialId.get()]!.name.get()}
              onSelected={(e) => {
                stok.materialId.set(e.id);
              }}
            />
          )}
        </Memo>
      </div>

      <Memo>
        {() => {
          const id = stok.materialId.get();

          if (id === "") return;

          return (
            <>
              <InputWithLabel
                label="Qty"
                inputProps={{
                  defaultValue: stok.qty.get(),
                  onBlur: (e) => stok.qty.set(+e.target.value),
                }}
              />
            </>
          );
        }}
      </Memo>
      <Button
        className="w-full"
        onClick={async () => {
          const result = ingoingMaterialStockSchema.safeParse(stok.get());
          if (!result.success) {
            toast.error(result.error.errors[0]!.message);
            return;
          }

          orderMaterials$[stok.id.get()]!.set(stok.get());

          onSubmit();
        }}
      >
        Submit
      </Button>
    </div>
  );
};
