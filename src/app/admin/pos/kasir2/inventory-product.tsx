"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTable } from "@/hooks/Table/useTable";
import { dexie } from "@/server/local/dexie";
import { Product, ProductVariant } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import Image from "next/image";
import React from "react";
import MyImage from "./image";
import { Label } from "@/components/ui/label";
import {
  DropdownMenuSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { string, z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SavedProduct, useKasir } from "./useKasir";
import { generateId } from "better-auth";
import { CustomForm } from "./custom-product";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { useDialog } from "@/hooks/useDialog";

const Inventory = () => {
  const products = useLiveQuery(() =>
    dexie.products
      .orderBy("name")
      .filter((x) => !x.deleted)
      .toArray(),
  );

  return <InventoryTable products={products ?? []} />;
};

export default Inventory;

const columns: ColumnDef<Product>[] = [
  {
    id: "name",
    accessorKey: "name",
  },
];

const InventoryTable: React.FC<{ products: Product[] }> = ({ products }) => {
  const table = useTable({
    data: products ?? [],
    columns,
  });
  return (
    <div className="">
      <Tabs defaultValue="inventory">
        <TabsList className="w-full">
          <TabsTrigger value="inventory" className="w-full">
            Inventory
          </TabsTrigger>
          <TabsTrigger value="custom" className="w-full">
            Custom
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inventory">
          <ScrollArea className="w-full flex-1">
            <div className="space-y-2 p-1">
              <div className="h-9">
                <DataTableFilterName table={table} />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {table.getRowModel().rows.map((x) => (
                  <InventoryProductCard
                    product={x.original}
                    key={x.original.id}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="custom">
          <CustomForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const InventoryProductCard: React.FC<{
  product: Product;
}> = ({ product }) => {
  const addProduct = useKasir((s) => s.addProduct);
  const dialog = useDialog();
  return (
    <Popover {...dialog.props}>
      <PopoverTrigger asChild>
        <Card key={product.id} className="overflow-hidden p-0">
          <CardContent className="p-0">
            <MyImage
              src={product.images[0] ?? ""}
              rootProps={{
                className: "aspect-square",
              }}
            />
            <div className="flex flex-col p-4">
              <Label className="line-clamp-1">{product.name}</Label>
            </div>
          </CardContent>
        </Card>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Cari Varian" className="h-9" />
          <CommandList>
            <CommandEmpty>Varian Tidak Ditemukan</CommandEmpty>
            <CommandGroup>
              <ProductVariantsDropdownMenu
                productId={product.id}
                onSelect={(data) => {
                  addProduct({
                    addon: [],
                    id: generateId(),
                    name: `${product.name} ${data.name}`,
                    price: data.price,
                    productId: data.product_id,
                    qty: 0,
                    variantId: data.id,
                    isCustom: false,
                    discount: {
                      isDiscounted: false,
                      name: "",
                      type: "percent",
                      value: 0,
                    },
                  });

                  dialog.dismiss();
                }}
              />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ProductVariantsDropdownMenu: React.FC<{
  productId: string;
  onSelect: (data: ProductVariant) => void;
}> = ({ productId, onSelect }) => {
  const variants = useLiveQuery(() =>
    dexie.productVariants
      .where("product_id")
      .equals(productId)
      .filter((x) => !x.deleted)
      .sortBy("name"),
  );

  return (
    <>
      {variants?.map((x) => (
        <CommandItem key={x.id} asChild>
          <Button
            onClick={() => onSelect(x)}
            className="w-full justify-start"
            variant={"ghost"}
          >
            {x.name}
          </Button>
        </CommandItem>
      ))}
    </>
  );
};
