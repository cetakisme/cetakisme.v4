"use client";

import React from "react";
import { type Addon, type SavedProduct, useKasir } from "./useKasir";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { useTable } from "@/hooks/Table/useTable";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { Button } from "@/components/ui/button";
import { LucideEdit, LucideTrash2 } from "lucide-react";
import { toRupiah } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDialog } from "@/hooks/useDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { useLiveQuery } from "dexie-react-hooks";
import { dexie } from "@/server/local/dexie";
import RenderList from "@/components/hasan/render-list";
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
import { generateId } from "better-auth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const getDiscount = (
  type: "percent" | "flat",
  price: number,
  discount: number,
) => {
  return type === "percent" ? price * discount * 0.01 : discount;
};

const columns: ColumnDef<SavedProduct>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ renderValue }) => (
      <div className="font-medium">{renderValue<string>()}</div>
    ),
    size: 1000,
  },
  {
    id: "harga",
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Harga" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>
          {toRupiah(
            (row.original.discount.isDiscounted
              ? row.original.price -
                getDiscount(
                  row.original.discount.type,
                  row.original.price,
                  row.original.discount.value,
                )
              : row.original.price) +
              row.original.addon.reduce((sum, next) => sum + next.price, 0),
          )}
        </span>
        <EditPriceSheet product={row.original} />
      </div>
    ),
  },
  {
    id: "addon",
    accessorFn: (row) => row.addon.length,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Addon" />
    ),
    cell: ({ row }) => <AddonSheet product={row.original} />,
  },
  {
    id: "qty",
    accessorKey: "qty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty" />
    ),
    cell: ({ row }) => <InputQty product={row.original} />,
  },
  {
    id: "action",
    cell: ({ row }) => <DeleteButton product={row.original} />,
  },
];

const AddonSheet: React.FC<{ product: SavedProduct }> = ({ product }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">{product.addon.length} Addon</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Addon</SheetTitle>
        </SheetHeader>
        <SelectedAddons addons={product.addon} product={product} />
        <Addons product={product} />
      </SheetContent>
    </Sheet>
  );
};

const SelectedAddons: React.FC<{
  product: SavedProduct;
  addons: Addon[];
}> = ({ product, addons }) => {
  const deleteAddon = useKasir((s) => s.deleteAddon);
  return (
    <RenderList
      className="mb-2 flex flex-wrap gap-1"
      data={addons}
      render={(data) => (
        <Badge key={data.id} onClick={() => deleteAddon(product, data)}>
          {data.name}
        </Badge>
      )}
    />
  );
};

const Addons: React.FC<{ product: SavedProduct }> = ({ product }) => {
  const addons = useLiveQuery(() =>
    dexie.productToAddons
      .where("product_id")
      .equals(product.productId)
      .filter((x) => !x.deleted)
      .toArray(),
  );
  return (
    <RenderList
      data={addons}
      getKey={(data) => data.id}
      render={(data) => (
        <AddonValues product={product} addonId={data.addon_id} />
      )}
    />
  );
};

const AddonValues: React.FC<{ product: SavedProduct; addonId: string }> = ({
  product,
  addonId,
}) => {
  const addonValues = useLiveQuery(() =>
    dexie.addonValues
      .where("addon_id")
      .equals(addonId)
      .filter((x) => !x.deleted)
      .toArray(),
  );
  const addon = useLiveQuery(() => dexie.addons.get(addonId));

  const addAddon = useKasir((s) => s.addAddon);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="w-full">{addon?.name ?? "Addon"}</Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Cari Addon..." className="h-9" />
          <CommandList>
            <CommandEmpty>Addon Tidak Ditemukan</CommandEmpty>
            <CommandGroup>
              {addonValues?.map((x) => (
                <CommandItem
                  key={x.id}
                  value={x.name}
                  onSelect={() => {
                    addAddon(product, {
                      addonId: x.addon_id,
                      addonValueId: x.id,
                      id: generateId(),
                      name: `${addon?.name ?? "Addon"} ${x.name}`,
                      price: x.price,
                    });
                  }}
                >
                  {x.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const DeleteButton: React.FC<{ product: SavedProduct }> = ({ product }) => {
  const deleteProduct = useKasir((s) => s.deleteProduct);
  return (
    <Button
      variant={"outline"}
      className="text-destructive"
      size={"icon"}
      onClick={() => deleteProduct(product)}
    >
      <LucideTrash2 />
    </Button>
  );
};

const InputQty: React.FC<{ product: SavedProduct }> = ({ product }) => {
  const updateQty = useKasir((s) => s.updateQty);
  return (
    <Input
      value={product.qty}
      onChange={(e) => updateQty(product, +e.target.value)}
      type="number"
    />
  );
};

const formSchema = z.object({
  price: z
    .string()
    .min(1)
    .refine((x) => !isNaN(+x)),
  discountValue: z.string(),
  discountName: z.string(),
  discountType: z.string(),
  isDiscount: z.boolean(),
});

const EditPriceSheet: React.FC<{ product: SavedProduct }> = ({ product }) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      discountName: product.discount.name,
      discountType: product.discount.type,
      discountValue: `${product.discount.value}`,
      price: `${product.price}`,
      isDiscount: product.discount.isDiscounted,
    },
  });

  const updatePrice = useKasir((s) => s.updatePrice);
  const updateDiscount = useKasir((s) => s.updateProductDiscount);

  const dialog = useDialog();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.isDiscount) {
      if (
        values.discountName === "" ||
        values.discountType === "" ||
        values.discountValue === ""
      ) {
        toast.error("Masukan Diskon Dengan Benar");
        return;
      }
    }

    updatePrice(product, +values.price);

    if (
      values.discountName !== "" &&
      values.discountValue !== "" &&
      !isNaN(+values.discountValue)
    ) {
      updateDiscount(product, {
        name: values.discountName,
        type: values.discountType as "flat" | "percent",
        value: +values.discountValue,
        isDiscounted: values.isDiscount,
      });
      dialog.dismiss();
    } else {
      dialog.dismiss();
    }
  };

  return (
    <Sheet {...dialog.props}>
      <SheetTrigger asChild>
        <Button variant={"outline"} size={"icon"}>
          <LucideEdit />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Harga</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <div>
                  <Label>Harga</Label>
                  <FormControl>
                    <Input {...field} placeholder="0" />
                  </FormControl>
                </div>
              )}
            />
            <div className="flex items-center gap-2">
              <div className="h-0.5 flex-1 bg-slate-300" />
              <Label>Diskon</Label>
              <div className="h-0.5 flex-1 bg-slate-300" />
            </div>
            <FormField
              control={form.control}
              name="isDiscount"
              render={({ field }) => (
                <div className="flex gap-2">
                  <Label>Diskon ?</Label>
                  <FormControl>
                    <Checkbox
                      onCheckedChange={field.onChange}
                      checked={field.value}
                    />
                  </FormControl>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="discountName"
              render={({ field }) => (
                <div>
                  <Label>Nama Diskon</Label>
                  <FormControl>
                    <Input {...field} placeholder="0" />
                  </FormControl>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="discountType"
              render={({ field }) => (
                <div>
                  <Label>Tipe</Label>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="percent" />
                        </FormControl>
                        <FormLabel className="font-normal">Persen</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="flat" />
                        </FormControl>
                        <FormLabel className="font-normal">Bulat</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="discountValue"
              render={({ field }) => (
                <div>
                  <Label>Harga</Label>
                  <FormControl>
                    <Input {...field} placeholder="0" />
                  </FormControl>
                </div>
              )}
            />
            <Button>Submit</Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

const KasirProductTable: React.FC<{ orderId: string | null }> = ({
  orderId,
}) => {
  const products = useKasir((s) => s.products);
  const editOrder = useKasir((s) => s.editSavedOrder);

  const table = useTable({
    data: products,
    columns,
  });

  React.useEffect(() => {
    if (!orderId) return;
    editOrder(orderId);
  }, [orderId, editOrder]);

  return (
    <div className="space-y-2 p-1">
      <div className="h-9">
        <DataTableFilterName table={table} />
      </div>
      <DataTableContent table={table} />
    </div>
  );
};

export default KasirProductTable;
