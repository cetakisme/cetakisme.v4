"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { dexie } from "@/server/local/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import {
  LucideDollarSign,
  LucideDownload,
  LucidePercent,
  LucideUpload,
} from "lucide-react";
import React from "react";
import { Discount, useKasir } from "./useKasir";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { generateId } from "better-auth";
import { useDialog } from "@/hooks/useDialog";
import {
  discounts$,
  incomes$,
  newOrders$,
  orderStatuses,
  paymentStatuses,
  savedAddons$,
  savedCosts$,
  savedDiscounts$,
  savedOrderProducts$,
  savedOrders$,
} from "@/server/local/db";
import { toast } from "sonner";
import RenderList, { List } from "@/components/hasan/render-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NewOrder } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isoNow, now } from "@/lib/utils";

const ActionButtons = () => {
  return (
    <div className="flex justify-between">
      <div className="flex gap-2">
        <LoadSavedOrderButton />
        <SaveOrderButton />
      </div>
      <div className="flex gap-2">
        <AddDiscountButton />
        <AddCostButton />
      </div>
      <div className="">
        <PayButton />
      </div>
    </div>
  );
};

export default ActionButtons;

const formSchema = z.object({
  method: z.string().min(1),
  gateway: z.string().min(1),
  paid: z
    .string()
    .min(1)
    .refine((data) => !isNaN(+data)),
  notes: z.string(),
});

const PayButton = () => {
  const method = useKasir((s) => s.method);
  const gateway = useKasir((s) => s.gateway);
  const paid = useKasir((s) => s.paid);
  const notes = useKasir((s) => s.notes);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      method: "Cash",
      gateway: "-",
      paid: "",
      notes: "",
    },
  });

  React.useEffect(() => form.setValue("method", method), [method, form]);
  React.useEffect(() => form.setValue("gateway", gateway), [gateway, form]);
  React.useEffect(() => form.setValue("paid", paid.toString()), [paid, form]);
  React.useEffect(() => form.setValue("notes", notes), [notes, form]);

  const customer = useKasir((s) => s.customer);

  const products = useKasir((s) => s.products);
  const productsToDelete = useKasir((s) => s.productsToDelete);

  const discounts = useKasir((s) => s.discounts);
  const discountsToDelete = useKasir((s) => s.discountsToDelete);

  const costs = useKasir((s) => s.costs);
  const costsToDelete = useKasir((s) => s.costsToDelete);

  const totalProducts = useKasir((s) => s.totalProduct);
  const totalDiscount = useKasir((s) => s.totalDiscount);
  const totalCost = useKasir((s) => s.totalCost);

  const newOrderId = useKasir((s) => s.newOrderId);
  const savedOrderId = useKasir((s) => s.savedOrderId);

  const reset = useKasir((s) => s.reset);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!customer) {
      toast.error("Masukkan Pelanggan Dahulu");
      return;
    }

    if (products.length === 0) {
      toast.error("Tambahkan Produk Dahulu");
      return;
    }

    for (const product of productsToDelete) {
      for (const addon of product.addon) {
        if (savedAddons$[addon.id] !== undefined)
          savedAddons$[addon.id]!.delete();
      }

      if (savedOrderProducts$[product.id] !== undefined) {
        savedOrderProducts$[product.id]!.delete();
      }
    }

    for (const discount of discountsToDelete) {
      if (savedDiscounts$[discount.id] !== undefined)
        savedDiscounts$[discount.id]!.delete();
    }

    for (const cost of costsToDelete) {
      if (savedCosts$[cost.id] !== undefined) savedCosts$[cost.id]!.delete();
    }

    for (const product of products) {
      for (const addon of product.addon) {
        savedAddons$[addon.id]!.set({
          id: addon.id,
          addonId: addon.addonId,
          addonValueId: addon.addonValueId,
          name: addon.name,
          price: addon.price,
          savedOrderProductId: product.id,
          deleted: false,
        });
      }

      savedOrderProducts$[product.id]!.set({
        id: product.id,
        name: product.name,
        price: product.price,
        productId: product.productId,
        variantId: product.variantId,
        deleted: false,
        addon: product.addon.map((x) => x.id),
        discountName: product.discount.name,
        discountType: product.discount.type,
        discountValue: product.discount.value,
        isDiscounted: product.discount.isDiscounted,
        savedOrderId: savedOrderId,
        qty: product.qty,
        isCustom: product.isCustom,
      });
    }

    for (const cost of costs) {
      savedCosts$[cost.id]!.set({
        id: cost.id,
        name: cost.name,
        type: cost.type,
        value: cost.value,
        deleted: false,
        savedOrderId: savedOrderId,
      });
    }

    for (const discount of discounts) {
      savedDiscounts$[discount.id]!.set({
        id: discount.id,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        deleted: false,
        savedOrderId: savedOrderId,
      });
    }

    savedOrders$[savedOrderId]!.set({
      costsId: costs.map((x) => x.id),
      discountsId: discounts.map((x) => x.id),
      newOrderId: newOrderId,
      savedOrderProductsId: products.map((x) => x.id),
      deleted: false,
      id: savedOrderId,
      creteadAt: isoNow()!,
      totalCosts: totalCost,
      totalDiscounts: totalDiscount,
      totalProducts: totalProducts,
      gateway: values.gateway,
      method: values.method,
      paid: +values.paid,
    });

    if (newOrders$[newOrderId]?.get() === undefined) {
      newOrders$[newOrderId]!.set((p) => {
        return {
          customer_id: customer.id,
          deadline: null,
          deleted: false,
          driveUrl: "",
          id: newOrderId,
          notes: values.notes,
          order_status: orderStatuses[0],
          payment_status:
            totalProducts - totalDiscount + totalCost === +values.paid
              ? paymentStatuses[2]
              : paymentStatuses[0],
          savedOrdersId: [savedOrderId],
          createdAt: isoNow(),
        };
      });
    } else {
      newOrders$[newOrderId]!.set((p) => {
        return {
          customer_id: customer.id,
          deadline: null,
          deleted: false,
          driveUrl: "",
          id: newOrderId,
          notes: values.notes,
          order_status: orderStatuses[0],
          payment_status:
            totalProducts - totalDiscount + totalCost === +values.paid
              ? paymentStatuses[2]
              : +values.paid === 0
                ? paymentStatuses[0]
                : paymentStatuses[1],
          savedOrdersId: [...(p.savedOrdersId ?? []), savedOrderId],
          createdAt: isoNow(),
        };
      });
    }

    incomes$[newOrderId]!.set({
      id: newOrderId,
      createdAt: isoNow(),
      deleted: false,
      income: +values.paid,
      notes: `${customer.name} beli ${products.map((x) => `${x.qty} ${x.name}`).join(", ")}`,
      targetId: "",
      type: "order",
      updatedAt: isoNow(),
    });

    reset();
    form.reset();
  };

  const methodForm = form.watch("method");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Bayar</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Bayar</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Metode</Label>
                  <FormControl>
                    <Select
                      defaultValue={field.value}
                      onValueChange={(data) => form.setValue(field.name, data)}
                    >
                      <SelectTrigger>{field.value}</SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />
            {methodForm === "Transfer" && (
              <FormField
                control={form.control}
                name="gateway"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={(data) =>
                          form.setValue(field.name, data)
                        }
                      >
                        <SelectTrigger>{field.value}</SelectTrigger>
                        <SelectContent>
                          {[
                            "BRI",
                            "BNI",
                            "BCA",
                            "QRIS",
                            "DANA",
                            "BSI",
                            "MANDIRI",
                            "CIMB",
                            "DANAMON",
                            "BUKOPIN",
                            "BTN",
                          ]
                            .sort()
                            .map((x) => (
                              <SelectItem value={x} key={x}>
                                {x}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="paid"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Bayar</Label>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              )}
            />
            <Button className="w-full">Submit</Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

const discountForm = z.object({
  name: z.string().min(1),
  value: z
    .string()
    .min(1)
    .refine((x) => !isNaN(+x)),
  type: z.string(),
});

const DiscountCostSheet: React.FC<{
  title: string;
  icon: React.ReactNode;
  onSubmit: (data: Discount) => void;
}> = ({ title, icon, onSubmit: _onSubmit }) => {
  const form = useForm({
    resolver: zodResolver(discountForm),
    defaultValues: {
      name: "",
      value: "",
      type: "percent",
    },
  });
  const dialog = useDialog();
  const onSubmit = (values: z.infer<typeof discountForm>) => {
    _onSubmit({
      ...values,
      id: generateId(),
      type: values.type as "flat" | "percent",
      value: +values.value,
    });

    form.reset();
    dialog.dismiss();
  };

  return (
    <Sheet {...dialog.props}>
      <SheetTrigger asChild>
        <Button variant={"outline"} size={"icon"}>
          {icon}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs
              defaultValue="percent"
              onValueChange={(e) => form.setValue("type", e)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="percent" className="w-full">
                  Persen
                </TabsTrigger>
                <TabsTrigger value="flat" className="w-full">
                  Bulat
                </TabsTrigger>
              </TabsList>
              <TabsContent value="percent">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <FormControl>
                        <Input {...field} placeholder={`Nama ${title}`} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Persen</Label>
                      <FormControl>
                        <Input {...field} placeholder="0%" />
                      </FormControl>
                      <FormMessage />
                    </div>
                  )}
                />
              </TabsContent>
              <TabsContent value="flat">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <FormControl>
                        <Input {...field} placeholder={`Nama ${title}`} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label>Harga</Label>
                      <FormControl>
                        <Input {...field} placeholder="0" />
                      </FormControl>
                      <FormMessage />
                    </div>
                  )}
                />
              </TabsContent>
            </Tabs>
            <Button>Submit</Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

const AddDiscountButton = () => {
  const addDisount = useKasir((s) => s.addDiscount);
  return (
    <DiscountCostSheet
      icon={<LucidePercent />}
      onSubmit={addDisount}
      title="Diskon"
    />
  );
};

const AddCostButton = () => {
  const addCost = useKasir((s) => s.addCost);
  return (
    <DiscountCostSheet
      icon={<LucideDollarSign />}
      onSubmit={addCost}
      title="Biaya Tambahan"
    />
  );
};

const SaveOrderButton = () => {
  const customer = useKasir((s) => s.customer);

  const products = useKasir((s) => s.products);
  const productsToDelete = useKasir((s) => s.productsToDelete);

  const discounts = useKasir((s) => s.discounts);
  const discountsToDelete = useKasir((s) => s.discountsToDelete);

  const costs = useKasir((s) => s.costs);
  const costsToDelete = useKasir((s) => s.costsToDelete);

  const newOrderId = useKasir((s) => s.newOrderId);
  const savedOrderId = useKasir((s) => s.savedOrderId);

  const totalProduct = useKasir((s) => s.totalProduct);
  const totalDiscount = useKasir((s) => s.totalDiscount);
  const totalCost = useKasir((s) => s.totalCost);

  const reset = useKasir((s) => s.reset);

  const save = () => {
    if (!customer) {
      toast.error("Masukkan Pelanggan Dahulu");
      return;
    }

    if (products.length === 0) {
      toast.error("Tambahkan Produk Dahulu");
      return;
    }

    for (const product of productsToDelete) {
      for (const addon of product.addon) {
        if (savedAddons$[addon.id] !== undefined)
          savedAddons$[addon.id]!.delete();
      }

      if (savedOrderProducts$[product.id] !== undefined) {
        savedOrderProducts$[product.id]!.delete();
      }
    }

    for (const discount of discountsToDelete) {
      if (savedDiscounts$[discount.id] !== undefined)
        savedDiscounts$[discount.id]!.delete();
    }

    for (const cost of costsToDelete) {
      if (savedCosts$[cost.id] !== undefined) savedCosts$[cost.id]!.delete();
    }

    for (const product of products) {
      for (const addon of product.addon) {
        savedAddons$[addon.id]!.set({
          id: addon.id,
          addonId: addon.addonId,
          addonValueId: addon.addonValueId,
          name: addon.name,
          price: addon.price,
          savedOrderProductId: product.id,
          deleted: false,
        });
      }

      savedOrderProducts$[product.id]!.set({
        id: product.id,
        name: product.name,
        price: product.price,
        productId: product.productId,
        variantId: product.variantId,
        deleted: false,
        addon: product.addon.map((x) => x.id),
        discountName: product.discount.name,
        discountType: product.discount.type,
        discountValue: product.discount.value,
        isDiscounted: product.discount.isDiscounted,
        savedOrderId: savedOrderId,
        qty: product.qty,
        isCustom: product.isCustom,
      });
    }

    for (const cost of costs) {
      savedCosts$[cost.id]!.set({
        id: cost.id,
        name: cost.name,
        type: cost.type,
        value: cost.value,
        deleted: false,
        savedOrderId: savedOrderId,
      });
    }

    for (const discount of discounts) {
      savedDiscounts$[discount.id]!.set({
        id: discount.id,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        deleted: false,
        savedOrderId: savedOrderId,
      });
    }

    savedOrders$[savedOrderId]!.set({
      costsId: costs.map((x) => x.id),
      discountsId: discounts.map((x) => x.id),
      newOrderId: newOrderId,
      savedOrderProductsId: products.map((x) => x.id),
      deleted: false,
      id: savedOrderId,
      creteadAt: now().toISO()!,
      totalCosts: totalCost,
      totalDiscounts: totalDiscount,
      totalProducts: totalProduct,
      gateway: "",
      method: "",
      paid: 0,
    });

    newOrders$[newOrderId]!.set({
      customer_id: customer.id,
      deadline: null,
      deleted: false,
      driveUrl: "",
      id: newOrderId,
      notes: "",
      order_status: "pending",
      payment_status: "pending",
      savedOrdersId: [savedOrderId],
      createdAt: now().toISO()!,
    });

    reset();

    toast.success("Order Berhasil Disimpan");
  };

  return (
    <Button variant={"outline"} size={"icon"} onClick={save}>
      <LucideDownload />
    </Button>
  );
};

const LoadSavedOrderButton = () => {
  const savedOrders = useLiveQuery(() =>
    dexie.newOrders.where("payment_status").equals("pending").toArray(),
  );

  const dialog = useDialog();

  return (
    <Sheet {...dialog.props}>
      <SheetTrigger asChild>
        <Button variant={"outline"} size={"icon"}>
          <LucideUpload />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Load Order</SheetTitle>
        </SheetHeader>
        <RenderList
          data={savedOrders}
          render={(data) => (
            <SavedOrderAccordion
              newOrder={data}
              customerId={data.customer_id}
              savedOrderId={data.savedOrdersId.at(-1) ?? ""}
              onSelect={dialog.dismiss}
            />
          )}
        />
      </SheetContent>
    </Sheet>
  );
};

const SavedOrderAccordion: React.FC<{
  newOrder: NewOrder;
  customerId: string;
  savedOrderId: string;
  onSelect: () => void;
}> = ({ onSelect, newOrder, customerId, savedOrderId }) => {
  const customer = useLiveQuery(() => dexie.customers.get(customerId));
  const savedOrder = useLiveQuery(() => dexie.savedOrders.get(savedOrderId));
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>{customer?.name}</AccordionTrigger>
        <AccordionContent>
          <SavedOrderProductsTable
            newOrder={newOrder}
            productsId={savedOrder?.savedOrderProductsId ?? []}
            onSelect={onSelect}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const SavedOrderProductsTable: React.FC<{
  productsId: string[];
  newOrder: NewOrder;
  onSelect: () => void;
}> = ({ onSelect, newOrder, productsId }) => {
  const products = useLiveQuery(() =>
    dexie.savedOrderProducts.where("id").anyOf(productsId).toArray(),
  );

  const loadOrder = useKasir((s) => s.loadSavedOrder);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Produk</TableHead>
            <TableHead>Qty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <List
            data={products}
            render={(data) => (
              <TableRow>
                <TableCell>{data.name}</TableCell>
                <TableCell>{data.qty}</TableCell>
              </TableRow>
            )}
          />
        </TableBody>
      </Table>
      <Button
        className="mt-4 w-full"
        onClick={() => {
          loadOrder(newOrder);
          onSelect();
        }}
      >
        Load
      </Button>
    </>
  );
};
