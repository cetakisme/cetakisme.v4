"use client";

import React, { Suspense, useContext, useEffect } from "react";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import RenderList from "@/components/hasan/render-list";
import type {
  Addon,
  AddonValue,
  Cost,
  Customer,
  Discount,
  Order,
  OrderVariant,
  Product,
  ProductVariant,
} from "@prisma/client";
import {
  addons$,
  costs$,
  customer$,
  discounts$,
  generateId,
  products$,
  orders$,
  productVariants$,
  orderVariants$,
  orderVariantAddons$,
  addonValues$,
  incomes$,
  orderHistories$,
} from "@/server/local/db";
import Img from "@/components/hasan/Image";
import {
  Memo,
  useMount,
  useObservable,
  useObserveEffect,
} from "@legendapp/state/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { PopoverButton } from "@/components/hasan/popover-button";
import { dexie } from "@/server/local/dexie";
import { useTable } from "@/hooks/Table/useTable";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { DataTableSelectorHeader } from "@/hooks/Table/DataTableSelectorHeader";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { type Observable } from "@legendapp/state";
import { Input } from "@/components/ui/input";
import Sheet from "@/components/hasan/sheet";
import { Button } from "@/components/ui/button";
import { toRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/hasan/combobox";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import DataTableDeleteSelection from "@/hooks/Table/DataTableDeleteSelection";
import { MdDownload, MdUpload } from "react-icons/md";
import { RiDiscountPercentLine, RiMoneyDollarCircleLine } from "react-icons/ri";
import Popover from "@/components/hasan/popover";
import { type IconType } from "react-icons/lib";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InputWithLabel from "@/components/hasan/input-with-label";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLiveQuery } from "dexie-react-hooks";
import { SheetClose } from "@/components/ui/sheet";
import { TiDeleteOutline } from "react-icons/ti";
import Alert from "@/components/hasan/alert";
import { useDialog } from "@/hooks/useDialog";
import { LucideDot, LucideEdit, LucidePlus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Authenticated from "@/components/hasan/auth/authenticated";
import AuthFallback from "@/components/hasan/auth/auth-fallback";
import { useSearchParams } from "next/navigation";
import Conditional from "@/components/hasan/conditional";
import { DialogProps } from "@radix-ui/react-dialog";
import { CommandItem } from "@/components/ui/command";

interface IKasirContext {
  isLoadFromSave: boolean;
  isEditMode: boolean;
  orderId: string;
  orderHistoryId: string;
  variants: Variant[];
  customer: Customer | null;
  discounts: Discount[];
  costs: Cost[];
  variantsToDelete: Variant[];
  discountsToDelete: Discount[];
  costsToDelete: Cost[];
  totalAll: number;
  totalBeforeDiscount: number;
  totalAfterDiscont: number;
}

type Variant = {
  id: string;
  variant: ProductVariant;
  qty: number;
  total: number;
  price: number;
  addons: { id: string; addon: AddonValue; qty: number }[];
};

const KasirContext = React.createContext<Observable<IKasirContext>>(
  undefined as any,
);

const useResetOrder = () => {
  const ctx$ = useContext(KasirContext);

  const reset = React.useCallback(() => {
    ctx$.set({
      orderId: generateId(),
      variants: [],
      customer: null,
      discounts: [],
      costs: [],
      variantsToDelete: [],
      discountsToDelete: [],
      costsToDelete: [],
      isLoadFromSave: false,
      isEditMode: false,
      totalAll: 0,
      orderHistoryId: generateId(),
      totalAfterDiscont: 0,
      totalBeforeDiscount: 0,
    });
  }, [ctx$]);

  return reset;
};

const GetOrderComponent = () => {
  const ctx$ = useContext(KasirContext);
  const searchParams = useSearchParams();
  useEffect(() => {
    const orderId = searchParams.get("id");
    if (!orderId) return;
    const f = async () => {
      const order = await dexie.orders.get(orderId);
      if (!order) return;
      const data = await constructOrder(order, true);
      ctx$.set(data);
    };
    f();
  }, [searchParams]);
  return <></>;
};

const Page = () => {
  const ctx$ = useObservable<IKasirContext>({
    orderId: generateId(),
    orderHistoryId: generateId(),
    variants: [],
    customer: null,
    discounts: [],
    costs: [],
    variantsToDelete: [],
    discountsToDelete: [],
    costsToDelete: [],
    isLoadFromSave: false,
    isEditMode: false,
    totalAll: 0,
    totalAfterDiscont: 0,
    totalBeforeDiscount: 0,
  });

  const total = useObservable(0);
  const totalDiscount = useObservable(0);
  const totalCosts = useObservable(0);
  const totalAll = useObservable(0);

  useObserveEffect(() => {
    totalAll.set(total.get() - totalDiscount.get() + totalCosts.get());
    ctx$.totalAll.set(totalAll.get());
    ctx$.totalBeforeDiscount.set(total.get());
    ctx$.totalAfterDiscont.set(total.get() - totalDiscount.get());
  });

  useObserveEffect(() => {
    const value = ctx$.costs.get().reduce((next, a) => {
      if (a.type === "flat") {
        return next + a.value;
      } else {
        return next + a.value * 0.01 * (total.get() - totalDiscount.get());
      }
    }, 0);
    totalCosts.set(value);
  });

  useObserveEffect(() => {
    totalDiscount.set(
      ctx$.discounts.get().reduce((next, a) => {
        if (a.type === "flat") {
          return next + a.value;
        } else {
          return next + a.value * 0.01 * total.get();
        }
      }, 0),
    );
  });

  useObserveEffect(() => {
    total.set(
      ctx$.variants.get().reduce((next, a) => next + a.total * a.qty, 0),
    );
  });

  const save = async () => {
    const customer = ctx$.customer.get();
    if (!customer) {
      toast.error("Pilih Pelanggan Terlebih Dahulu");
      return;
    }

    if (ctx$.variants.length === 0) {
      toast.error("Pilih Varian Terlebih Dahulu");
      return;
    }

    orders$[ctx$.orderId.get()]!.set({
      id: ctx$.orderId.get(),
      created_at: new Date().toISOString(),
      customer_id: customer.id,
      deadline: null,
      deleted: false,
      order_status: "pending",
      payment_status: "pending",
      notes: "",
      driveUrl: "",
    });

    orderHistories$[ctx$.orderHistoryId.get()]!.set({
      deleted: false,
      created_at: new Date().toISOString(),
      id: ctx$.orderHistoryId.get(),
      orderId: ctx$.orderId.get(),
      paid: 0,
      payment_provider: "",
      payment_type: "",
      total: 0,
      totalAfterDiscount: total.get() - totalDiscount.get(),
      totalBeforeDiscount: total.get(),
    });

    discounts$.set((prev) => {
      const updated = { ...prev };

      for (const element of ctx$.discountsToDelete.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          name: "",
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          type: "",
          value: 0,
        };
      }

      for (const element of ctx$.discounts.get()) {
        updated[element.id] = {
          name: element.name,
          deleted: false,
          id: element.id,
          orderHistoryId: element.orderHistoryId,
          type: element.type,
          value: element.value,
        };
      }

      return updated;
    });

    costs$.set((prev) => {
      const updated = { ...prev };
      for (const element of ctx$.costsToDelete.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          name: "",
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          type: "",
          value: 0,
        };
      }

      for (const element of ctx$.costs.get()) {
        updated[element.id] = {
          name: element.name,
          deleted: false,
          id: element.id,
          orderHistoryId: element.orderHistoryId,
          type: element.type,
          value: element.value,
        };
      }
      return updated;
    });

    orderVariants$.set((prev) => {
      const updated = { ...prev };

      for (const element of ctx$.variantsToDelete.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          qty: 0,
          variant_id: "",
          price: 0,
        };
      }

      for (const element of ctx$.variants.get()) {
        updated[element.id] = {
          deleted: false,
          id: element.id,
          orderHistoryId: ctx$.orderHistoryId.get(),
          qty: element.qty,
          variant_id: element.variant.id,
          price: element.price,
        };
      }

      return updated;
    });

    orderVariantAddons$.set((prev) => {
      const updated = { ...prev };
      const addonsToDelete = ctx$.variantsToDelete
        .get()
        .flatMap((x) => x.addons.map((a) => ({ id: x.id, addon: a })));
      for (const element of addonsToDelete) {
        if (!updated[element.id]) continue;
        updated[element.addon.id] = {
          addonValueId: "",
          qty: 0,
          orderVariantId: "",
          id: element.addon.id,
          deleted: true,
        };
      }

      const addons = ctx$.variants
        .get()
        .flatMap((x) => x.addons.map((a) => ({ id: x.id, addon: a })));
      for (const element of addons) {
        updated[element.addon.id] = {
          addonValueId: element.addon.addon.id,
          qty: element.addon.qty,
          orderVariantId: element.id,
          id: element.addon.id,
          deleted: false,
        };
      }

      return updated;
    });

    reset();
  };

  const reset = () => {
    ctx$.set({
      orderId: generateId(),
      orderHistoryId: generateId(),
      variants: [],
      customer: null,
      discounts: [],
      costs: [],
      variantsToDelete: [],
      discountsToDelete: [],
      costsToDelete: [],
      isLoadFromSave: false,
      isEditMode: false,
      totalAll: 0,
      totalAfterDiscont: 0,
      totalBeforeDiscount: 0,
    });
  };

  return (
    <Authenticated permission="kasir" fallback={AuthFallback}>
      <KasirContext.Provider value={ctx$}>
        <Suspense>
          <GetOrderComponent />
        </Suspense>
        <ResizablePanelGroup direction="horizontal" className="gap-2 p-8">
          <ResizablePanel defaultSize={60}>
            <div className="flex h-full flex-col gap-2">
              <div className="flex items-center gap-4">
                <Label>Pelanggan : </Label>
                <Memo>
                  {() => <CustomerSelector customer={ctx$.customer.get()} />}
                </Memo>
              </div>
              <ScrollArea className="flex-1 space-y-2">
                <Memo>
                  {() => <VariantTable variants={ctx$.variants.get()} />}
                </Memo>
                <div className="mt-4 font-bold">Diskon</div>
                <Memo>
                  {() => {
                    const _t = total.get();
                    return (
                      <RenderList
                        data={ctx$.discounts.get().filter((x) => !x.deleted)}
                        renderEmpty={() => <div className="p-2 px-4">-</div>}
                        render={(data, index) => (
                          <Button
                            onClick={() => {
                              ctx$.discountsToDelete.push(data);
                              ctx$.discounts.splice(index, 1);
                            }}
                            className="w-full justify-between hover:bg-destructive hover:text-destructive-foreground"
                            variant="ghost"
                          >
                            <span>
                              Diskon {data.name}{" "}
                              {data.type === "percent" && data.value + "%"}
                            </span>
                            <span>
                              -{" "}
                              {data.type === "flat"
                                ? toRupiah(data.value)
                                : toRupiah(_t * data.value * 0.01)}
                            </span>
                          </Button>
                        )}
                      />
                    );
                  }}
                </Memo>
                <div className="mt-4 font-bold">Biaya Tambahan</div>
                <Memo>
                  {() => {
                    const _t = total.get();
                    const _d = totalDiscount.get();

                    return (
                      <RenderList
                        data={ctx$.costs.get().filter((x) => !x.deleted)}
                        renderEmpty={() => <div className="p-2 px-4">-</div>}
                        render={(data, index) => (
                          <Button
                            onClick={() => {
                              ctx$.costsToDelete.push(data);
                              ctx$.costs.splice(index, 1);
                            }}
                            className="w-full justify-between hover:bg-destructive hover:text-destructive-foreground"
                            variant="ghost"
                          >
                            <span>
                              Biaya {data.name}{" "}
                              {data.type === "percent" && data.value + "%"}
                            </span>
                            <span>
                              {" "}
                              {data.type === "flat"
                                ? toRupiah(data.value)
                                : toRupiah((_t - _d) * data.value * 0.01)}
                            </span>
                          </Button>
                        )}
                      />
                    );
                  }}
                </Memo>
              </ScrollArea>
              <div className="border-t pt-2">
                <div className="flex h-5 items-center justify-between">
                  <Label>Total</Label>
                  <Memo>{() => <Label>{toRupiah(total.get())}</Label>}</Memo>
                </div>
                <div className="flex h-5 items-center justify-between">
                  <Label>Total Diskon</Label>
                  <Memo>
                    {() => <Label>- {toRupiah(totalDiscount.get())}</Label>}
                  </Memo>
                </div>
                <div className="flex h-5 items-center justify-between">
                  <Label>Total Biaya Tambahan</Label>
                  <Memo>
                    {() => <Label>{toRupiah(totalCosts.get())}</Label>}
                  </Memo>
                </div>
                <div className="mt-4 flex h-5 items-center justify-between">
                  <Label>Total Keseluruhan</Label>
                  <Memo>{() => <Label>{toRupiah(totalAll.get())}</Label>}</Memo>
                </div>
              </div>
              <div className="flex justify-between">
                <div className="flex gap-1">
                  <Memo>
                    {() => (
                      <Conditional condition={!ctx$.isEditMode.get()}>
                        <SavedOrdersSheet />

                        <Authenticated permission="kasir-update">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => save()}
                          >
                            <MdDownload />
                          </Button>
                        </Authenticated>
                        <NewOrder />
                        <Authenticated permission="kasir-delete">
                          <DeleteOrder />
                        </Authenticated>
                      </Conditional>
                    )}
                  </Memo>
                </div>
                <div className="flex gap-1">
                  <DiscountPopover
                    title="Diskon"
                    Icon={RiDiscountPercentLine}
                    onSubmit={(data) => ctx$.discounts.push(data)}
                  />
                  <DiscountPopover
                    title="Biaya"
                    Icon={RiMoneyDollarCircleLine}
                    onSubmit={(data) => ctx$.costs.push(data)}
                  />
                </div>
                <div className="">
                  <PaySheet />
                </div>
              </div>
            </div>
          </ResizablePanel>
          <ResizablePanel defaultSize={40}>
            <ScrollArea className="h-full">
              <ProductKatalog />
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </KasirContext.Provider>
    </Authenticated>
  );
};

const paymentGateway = ["BRI", "BCA", "BNI", "QRIS", "ShopeePay", "DANA"];

const PaySheet = () => {
  const ctx$ = useContext(KasirContext);
  const reset = useResetOrder();
  const pay$ = useObservable<{
    paymentType: string;
    amount: number;
    paymentGateway: string;
    note: string;
  }>({
    paymentType: "cash",
    amount: 0,
    paymentGateway: "Cash",
    note: "",
  });

  const dialog = useDialog();

  useObserveEffect(() => {
    if (!ctx$.isEditMode) return;

    const f = async () => {
      const orderHistory = await dexie.orderHistory
        .where("orderId")
        .equals(ctx$.orderId.get())
        .reverse()
        .sortBy("createdAt");

      const lastOrderHistory = orderHistory.at(-1);

      if (!lastOrderHistory) return;

      pay$.set({
        amount: lastOrderHistory.paid,
        note: "",
        paymentGateway: lastOrderHistory.payment_provider,
        paymentType: lastOrderHistory.payment_type,
      });
    };

    f();
  });

  const pay = () => {
    const customer = ctx$.customer.get();
    if (customer === null) {
      toast.error("Masukan Pelanggan Terlebih Dahulu");
      return;
    }

    if (ctx$.variants.length === 0) {
      toast.error("Pilih Produk Terlebih Dahulu");
      return;
    }

    dialog.trigger();
  };

  const finalize = () => {
    const customer = ctx$.customer.get();
    if (customer === null) {
      toast.error("Masukan Pelanggan Terlebih Dahulu");
      return;
    }

    if (ctx$.variants.length === 0) {
      toast.error("Pilih Produk Terlebih Dahulu");
      return;
    }

    orders$[ctx$.orderId.get()]!.set({
      id: ctx$.orderId.get(),
      created_at: new Date().toISOString(),
      driveUrl: "",
      customer_id: customer.id,
      deadline: null,
      deleted: false,
      // paid: pay$.amount.get(),
      order_status: "pending",
      payment_status:
        pay$.amount.get() === ctx$.totalAll.get() ? "Lunas" : "DP",
      // payment_type: pay$.paymentType.get(),
      notes: pay$.note.get(),
      // payment_provider:
      //   pay$.paymentType.get() === "Cash" ? "Cash" : pay$.paymentGateway.get(),
      // total: ctx$.totalAll.get(),
    });

    const orderHistoryId = ctx$.isEditMode
      ? generateId()
      : ctx$.orderHistoryId.get();

    orderHistories$[orderHistoryId]!.set({
      id: orderHistoryId,
      created_at: new Date().toISOString(),
      deleted: false,
      orderId: ctx$.orderId.get(),
      paid: pay$.amount.get(),
      payment_provider:
        pay$.paymentType.get() === "Cash" ? "Cash" : pay$.paymentGateway.get(),
      payment_type: pay$.paymentType.get(),
      total: ctx$.totalAll.get(),
      totalAfterDiscount: ctx$.totalAfterDiscont.get(),
      totalBeforeDiscount: ctx$.totalBeforeDiscount.get(),
    });

    discounts$.set((prev) => {
      const updated = { ...prev };

      for (const element of ctx$.discountsToDelete.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          name: "",
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          type: "",
          value: 0,
        };
      }

      for (const element of ctx$.discounts.get()) {
        updated[element.id] = {
          name: element.name,
          deleted: false,
          id: element.id,
          orderHistoryId: orderHistoryId,
          type: element.type,
          value: element.value,
        };
      }

      return updated;
    });

    costs$.set((prev) => {
      const updated = { ...prev };
      for (const element of ctx$.costsToDelete.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          name: "",
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          type: "",
          value: 0,
        };
      }

      for (const element of ctx$.costs.get()) {
        updated[element.id] = {
          name: element.name,
          deleted: false,
          id: element.id,
          orderHistoryId: orderHistoryId,
          type: element.type,
          value: element.value,
        };
      }
      return updated;
    });

    orderVariants$.set((prev) => {
      const updated = { ...prev };

      for (const element of ctx$.variantsToDelete.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          qty: 0,
          variant_id: "",
          price: 0,
        };
      }

      for (const element of ctx$.variants.get()) {
        updated[element.id] = {
          deleted: false,
          id: element.id,
          orderHistoryId: orderHistoryId,
          qty: element.qty,
          variant_id: element.variant.id,
          price: element.price,
        };
      }

      return updated;
    });

    orderVariantAddons$.set((prev) => {
      const updated = { ...prev };
      const addonsToDelete = ctx$.variantsToDelete
        .get()
        .flatMap((x) => x.addons.map((a) => ({ id: x.id, addon: a })));
      for (const element of addonsToDelete) {
        if (!updated[element.id]) continue;
        updated[element.addon.id] = {
          addonValueId: "",
          qty: 0,
          orderVariantId: "",
          id: element.addon.id,
          deleted: true,
        };
      }

      const addons = ctx$.variants
        .get()
        .flatMap((x) => x.addons.map((a) => ({ id: x.id, addon: a })));
      for (const element of addons) {
        updated[element.addon.id] = {
          addonValueId: element.addon.addon.id,
          qty: element.addon.qty,
          orderVariantId: element.id,
          id: element.addon.id,
          deleted: false,
        };
      }

      return updated;
    });

    if (ctx$.isEditMode.get()) {
      incomes$[ctx$.orderId.get()]!.set((p) => ({
        ...p,
        income:
          pay$.amount.get() > ctx$.totalAll.get()
            ? ctx$.totalAll.get()
            : pay$.amount.get(),
        notes: `Pemasukan Dari Order ${ctx$.customer.name.get()}`,
        updatedAt: new Date().toISOString(),
      }));
    } else {
      incomes$[ctx$.orderId.get()]!.set({
        createdAt: new Date().toISOString(),
        deleted: false,
        id: ctx$.orderId.get(),
        income:
          pay$.amount.get() > ctx$.totalAll.get()
            ? ctx$.totalAll.get()
            : pay$.amount.get(),
        notes: `Pemasukan Dari Order ${ctx$.customer.name.get()}`,
        type: "order",
        updatedAt: new Date().toISOString(),
      });
    }

    reset();
    toast.success("Order Berhasil Dibuat");
  };

  return (
    <>
      <Authenticated permission="kasir-create">
        <Button onClick={() => pay()}>Bayar</Button>
      </Authenticated>
      <Sheet
        {...dialog.props}
        title="Bayar"
        content={() => (
          <div className="space-y-2">
            <Memo>
              {() => (
                <Select
                  onValueChange={(e) => pay$.paymentType.set(e)}
                  defaultValue={pay$.paymentType.get()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipe Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Memo>
            <Memo>
              {() => {
                const type = pay$.paymentType.get();
                if (type === "cash") return null;
                return (
                  <Select
                    onValueChange={(e) => pay$.paymentGateway.set(e)}
                    defaultValue={pay$.paymentGateway.get()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Penyedia" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentGateway.sort().map((x) => (
                        <SelectItem key={x} value={x}>
                          {x}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            </Memo>
            <Label>Bayar</Label>
            <div className="relative h-9">
              <Memo>
                {() => (
                  <Input
                    className="h-9"
                    value={pay$.amount.get()}
                    onChange={(e) => pay$.amount.set(+e.target.value)}
                  />
                )}
              </Memo>
              <div className="absolute right-2 top-0 z-50 flex h-full w-fit items-center">
                <Button
                  className="h-4 w-4"
                  variant="destructive"
                  size="icon"
                  onClick={() => pay$.amount.set(0)}
                >
                  <LucideDot />
                </Button>
              </div>
            </div>
            <RenderList
              data={["Pas", "100000", "50000", "20000", "10000", "5000"]}
              className="flex flex-wrap gap-1"
              render={(data) => (
                <Badge
                  className="cursor-pointer"
                  onClick={() => {
                    if (data === "Pas") {
                      pay$.amount.set(ctx$.totalAll.get());
                    } else {
                      pay$.amount.set((p) => p + +data);
                    }
                  }}
                >
                  {data === "Pas" ? data : toRupiah(+data)}
                </Badge>
              )}
            />
            <Memo>
              {() => (
                <Textarea
                  className="resize-none"
                  placeholder="Catatan"
                  rows={5}
                  value={pay$.note.get()}
                  onChange={(e) => pay$.note.set(e.target.value)}
                />
              )}
            </Memo>
            <Button className="w-full" asChild>
              <SheetClose onClick={() => finalize()}>Bayar</SheetClose>
            </Button>
          </div>
        )}
      />
    </>
  );
};

const CustomerSelector: React.FC<{ customer: Customer | null }> = ({
  customer,
}) => {
  const ctx$ = useContext(KasirContext);

  const customers = useLiveQuery(() =>
    dexie.customers.filter((x) => x.deleted === false).toArray(),
  );

  const addDialog = useDialog();

  return (
    <>
      <Combobox
        data={customers ?? []}
        onSelected={(e) => {
          ctx$.customer.set(e);
        }}
        renderItem={(data) => <Label>{data.name}</Label>}
        title="Pelanggan"
        renderSelected={() => customer?.name ?? "Pilih Pelanggan"}
        renderAddButton={() => (
          <div className="p-1">
            <Button onClick={() => addDialog.trigger()} className="w-full">
              <LucidePlus /> Buat Customer Baru
            </Button>
          </div>
        )}
      />
      <CustomerForm
        onSave={(c) => {
          ctx$.customer.set(c);
          addDialog.dismiss();
        }}
        {...addDialog.props}
      />
    </>
  );
};

const CustomerForm: React.FC<
  { onSave: (c: Customer) => void } & DialogProps
> = ({ onSave, ...props }) => {
  const _customer$ = useObservable<Customer>({
    address: "",
    age: 0,
    deleted: false,
    id: "",
    job: "",
    name: "",
    notes: "",
    phone: "",
  });

  const save = () => {
    if (_customer$.name.get() === "") {
      toast.error("Nama Harus Diisi");
      return;
    }

    const id = generateId();
    _customer$.id.set(id);
    const c = { ..._customer$.get() };
    customer$[id]!.set(c);
    onSave(c);
    _customer$.name.set("");
  };

  return (
    <Sheet
      {...props}
      title="Customer Baru"
      content={() => (
        <div className="space-y-2">
          <Memo>
            {() => (
              <InputWithLabel
                label="Nama"
                inputProps={{
                  value: _customer$.name.get(),
                  onChange: (e) => _customer$.name.set(e.target.value),
                }}
              />
            )}
          </Memo>
          <Button onClick={() => save()}>Buat</Button>
        </div>
      )}
    />
  );
};

const ProductKatalog = () => {
  const products = useLiveQuery(() =>
    dexie.products.filter((x) => x.deleted === false).toArray(),
  );
  return (
    <RenderList
      className="grid grid-cols-4 gap-2"
      data={products}
      render={(data) => <ProductCard product={data} />}
    />
  );
};

const DeleteOrder = () => {
  const dialog = useDialog();
  const ctx$ = useContext(KasirContext);
  const reset = useResetOrder();

  const deleteOrder = () => {
    if (ctx$.variants.length > 0 && ctx$.customer.get() !== null) {
      dialog.trigger();
    }
  };

  const doDelete = () => {
    orders$[ctx$.orderId.get()]!.set((p) => ({
      id: p.id,
      created_at: p.created_at,
      customer_id: "",
      deadline: null,
      deleted: true,
      paid: 0,
      order_status: "",
      payment_status: "",
      payment_type: "",
      notes: "",
      payment_provider: "",
      driveUrl: "",
      total: 0,
    }));

    discounts$.set((prev) => {
      const updated = { ...prev };

      for (const element of ctx$.discountsToDelete.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          name: "",
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          type: "",
          value: 0,
        };
      }

      for (const element of ctx$.discounts.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          name: "",
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          type: "",
          value: 0,
        };
      }

      return updated;
    });

    costs$.set((prev) => {
      const updated = { ...prev };
      for (const element of ctx$.costsToDelete.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          name: "",
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          type: "",
          value: 0,
        };
      }

      for (const element of ctx$.costs.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          name: "",
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          type: "",
          value: 0,
        };
      }
      return updated;
    });

    orderVariants$.set((prev) => {
      const updated = { ...prev };

      for (const element of ctx$.variantsToDelete.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          qty: 0,
          variant_id: "",
          price: 0,
        };
      }

      for (const element of ctx$.variants.get()) {
        if (!updated[element.id]) continue;
        updated[element.id] = {
          deleted: true,
          id: element.id,
          orderHistoryId: "",
          qty: 0,
          variant_id: "",
          price: 0,
        };
      }

      return updated;
    });

    orderVariantAddons$.set((prev) => {
      const updated = { ...prev };
      const addonsToDelete = ctx$.variantsToDelete
        .get()
        .flatMap((x) => x.addons.map((a) => ({ id: x.id, addon: a })));
      for (const element of addonsToDelete) {
        if (!updated[element.addon.id]) continue;
        updated[element.addon.id] = {
          addonValueId: "",
          qty: 0,
          orderVariantId: "",
          id: element.addon.id,
          deleted: true,
        };
      }

      const addons = ctx$.variants
        .get()
        .flatMap((x) => x.addons.map((a) => ({ id: x.id, addon: a })));
      for (const element of addons) {
        if (!updated[element.addon.id]) continue;
        updated[element.addon.id] = {
          addonValueId: "",
          qty: 0,
          orderVariantId: "",
          id: element.addon.id,
          deleted: true,
        };
      }

      return updated;
    });

    reset();
  };

  return (
    <>
      <Memo>
        {() => (
          <Button
            variant="outline"
            size="icon"
            onClick={() => deleteOrder()}
            disabled={!ctx$.isLoadFromSave.get()}
          >
            <TiDeleteOutline />
          </Button>
        )}
      </Memo>
      <Alert
        {...dialog.props}
        title="Ingin Mengapus Orderan?"
        description="Apa anda yakin ingin menghapus orderan yang sedang dibuat?"
        renderAction={() => <Button onClick={doDelete}>Ya</Button>}
        renderCancel={() => <Button>Tidak</Button>}
      />
    </>
  );
};

const NewOrder = () => {
  const dialog = useDialog();
  const ctx$ = useContext(KasirContext);
  const reset = useResetOrder();

  const createNewOrder = () => {
    if (ctx$.variants.length > 0 && ctx$.customer.get() !== null) {
      dialog.trigger();
    } else {
      reset();
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => createNewOrder()}>
        <LucidePlus />
      </Button>
      <Alert
        {...dialog.props}
        title="Orderan Belum Disimpan"
        description="Apa anda yakin ingin membuat orderan baru tanpa menyimpan orderan yang sebelumnya?"
        renderAction={() => <Button onClick={reset}>Ya</Button>}
        renderCancel={() => <Button>Tidak</Button>}
      />
    </>
  );
};

const SavedOrdersSheet = () => {
  const orders = useLiveQuery(() =>
    dexie.orders.where("payment_status").equals("pending").toArray(),
  );

  return (
    <Sheet
      title="Orderan Tersimpan"
      trigger={() => (
        <Button variant="outline" size="icon">
          <MdUpload />
        </Button>
      )}
      content={() => (
        <Accordion type="single" collapsible>
          <RenderList
            data={orders}
            renderEmpty={() => (
              <div className="text-sm text-gray-400">
                Tidak ada order yang disimpan.
              </div>
            )}
            render={(data) => <OrderItem order={data} />}
          />
        </Accordion>
      )}
    />
  );
};

const constructOrder = async (order: Order, isEditMode: boolean) => {
  const orderHistory = await dexie.orderHistory
    .where("orderId")
    .equals(order.id)
    .reverse()
    .sortBy("createdAt");

  const orderHistoryId = orderHistory.at(-1)?.id ?? "";

  const [variants, customer, discounts, costs] = await Promise.all([
    dexie.orderVariants
      .where("orderHistoryId")
      .equals(orderHistoryId)
      .and((o) => !o.deleted)
      .toArray(),
    dexie.customers.where("id").equals(order.customer_id).first(),
    dexie.discounts
      .where("orderHistoryId")
      .equals(orderHistoryId)
      .and((o) => !o.deleted)
      .toArray(),
    dexie.costs
      .where("orderHistoryId")
      .equals(orderHistoryId)
      .and((o) => !o.deleted)
      .toArray(),
  ]);

  const orderVariantAddons = await dexie.orderVariantAddons
    .where("orderVariantId")
    .anyOf(variants.map((v) => v.id))
    .and((o) => !o.deleted)
    .toArray();

  const variantIds = new Set(variants.map((v) => v.variant_id));
  const variantValues = new Map<string, ProductVariant>(
    [...variantIds].map((id) => [id, productVariants$[id]!.get()]),
  );

  const addonValueIds = new Set(orderVariantAddons.map((a) => a.addonValueId));
  const addonValues = new Map<string, AddonValue>(
    [...addonValueIds].map((id) => [id, addonValues$[id]!.get()]),
  );

  const addonsByVariant = new Map<
    string,
    { id: string; addon: AddonValue; qty: number }[]
  >();
  for (const addon of orderVariantAddons) {
    if (!addonsByVariant.has(addon.orderVariantId)) {
      addonsByVariant.set(addon.orderVariantId, []);
    }
    addonsByVariant.get(addon.orderVariantId)!.push({
      id: isEditMode ? generateId() : addon.id,
      qty: addon.qty,
      addon: addonValues.get(addon.addonValueId)!, // Preloaded value
    });
  }

  const v: Variant[] = variants.map((x) => ({
    id: isEditMode ? generateId() : x.id,
    qty: x.qty,
    total: 0,
    price: x.price,
    variant: variantValues.get(x.variant_id)!, // Preloaded value
    addons: addonsByVariant.get(x.id) ?? [],
    deleted: x.deleted,
  }));

  const vWithTotal: Variant[] = v.map((x) => ({
    ...x,
    total: getTotal(x),
  }));

  const _order = {
    orderId: order.id,
    customer: customer ?? null,
    costs: isEditMode ? costs.map((x) => ({ ...x, id: generateId() })) : costs,
    discounts: isEditMode
      ? discounts.map((x) => ({ ...x, id: generateId() }))
      : discounts,
    variants: vWithTotal,
  };

  return {
    ..._order,
    variantsToDelete: [],
    discountsToDelete: [],
    costsToDelete: [],
    isLoadFromSave: isEditMode ? false : true,
    isEditMode: isEditMode,
    totalAll: 0,
    totalAfterDiscont: 0,
    totalBeforeDiscount: 0,
    orderHistoryId: orderHistoryId,
  };

  // order$.set({
  //   ..._order,
  //   variantsToDelete: [],
  //   discountsToDelete: [],
  //   costsToDelete: [],
  //   isLoadFromSave: true,
  //   totalAll: 0,
  //   orderHistoryId: orderHistoryId,
  // });
};

const OrderItem: React.FC<{ order: Order }> = ({ order }) => {
  const ctx$ = useContext(KasirContext);
  const order$ = useObservable<IKasirContext>({
    orderId: order.id,
    orderHistoryId: "",
    variants: [],
    customer: null,
    discounts: [],
    costs: [],
    variantsToDelete: [],
    discountsToDelete: [],
    costsToDelete: [],
    isLoadFromSave: true,
    isEditMode: false,
    totalAll: 0,
    totalAfterDiscont: 0,
    totalBeforeDiscount: 0,
  });

  useMount(async () => {
    const data = await constructOrder(order, false);
    order$.set(data);
  });

  return (
    <AccordionItem value={order.id}>
      <AccordionTrigger>
        {customer$[order.customer_id]!.name.get()}
      </AccordionTrigger>
      <AccordionContent>
        <Table>
          {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead>Pesanan</TableHead>
              <TableHead className="text-right">Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Memo>
              {() => (
                <>
                  {order$.variants.get().map((x) => (
                    <TableRow key={x.id}>
                      <TableCell>
                        {products$[x.variant.product_id]!.name.get()}{" "}
                        {x.variant.name}
                      </TableCell>
                      <TableCell className="text-right">{x.qty}</TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </Memo>
          </TableBody>
        </Table>
        <Button asChild>
          <SheetClose onClick={() => ctx$.set(order$.get())} className="w-full">
            Ambil
          </SheetClose>
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
};

const DiscountPopover: React.FC<{
  Icon: IconType;
  onSubmit: (data: Discount) => void;
  title: string;
}> = ({ Icon, onSubmit, title }) => {
  return (
    <Popover
      renderTrigger={() => (
        <Button variant="outline" size="icon">
          <Icon />
        </Button>
      )}
      content={() => <PopoverContent title={title} onSubmit={onSubmit} />}
    />
  );
};

const PopoverContent: React.FC<{
  title: string;
  onSubmit: (discount: Discount) => void;
}> = ({ onSubmit, title }) => {
  const ctx$ = useContext(KasirContext);

  const data = useObservable<{
    type: "flat" | "percent";
    value: number;
    name: string;
  }>({
    type: "percent",
    value: 0,
    name: "",
  });

  const _onSubmit = () => {
    if (data.name.get() === "") {
      toast.error("Masukkan Nama Terlebih Dahulu");
      return;
    }

    onSubmit({
      id: generateId(),
      deleted: false,
      name: data.name.get(),
      orderHistoryId: ctx$.orderHistoryId.get(),
      type: data.type.get(),
      value: data.value.get(),
    });

    data.set({
      type: "percent",
      value: 0,
      name: "",
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        _onSubmit();
      }}
      className="space-y-2"
    >
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Tabs defaultValue="percent">
        <TabsList className="w-full">
          <Memo>
            {() => (
              <>
                <TabsTrigger
                  value="percent"
                  className="w-full"
                  onClick={() => data.type.set("percent")}
                >
                  Persen
                </TabsTrigger>
                <TabsTrigger
                  value="flat"
                  className="w-full"
                  onClick={() => data.type.set("flat")}
                >
                  Bulat
                </TabsTrigger>
              </>
            )}
          </Memo>
        </TabsList>
      </Tabs>
      <Memo>
        {() => (
          <InputWithLabel
            label="Nama"
            inputProps={{
              value: data.name.get(),
              onChange: (e) => data.name.set(e.target.value),
            }}
          />
        )}
      </Memo>
      <Memo>
        {() => (
          <InputWithLabel
            label={data.type.get() === "percent" ? "Persen" : "Jumlah"}
            inputProps={{
              value: data.value.get(),
              onChange: (e) => data.value.set(+e.target.value),
              type: "number",
            }}
          />
        )}
      </Memo>
      <Button className="w-full">Tambah</Button>
    </form>
  );
};

export default Page;

const PriceEditSheet: React.FC<{
  orderVariant: Variant;
  index: number;
}> = ({ index, orderVariant }) => {
  const ctx$ = useContext(KasirContext);

  return (
    <Sheet
      title="Edit Harga"
      trigger={() => (
        <Button variant="ghost" size="icon" className="ml-2">
          <LucideEdit />
        </Button>
      )}
      content={() => (
        <div>
          <InputWithLabel
            label="Harga"
            inputProps={{
              defaultValue: orderVariant.price,
              onBlur: (e) => {
                ctx$.variants[index]!.price.set(+e.target.value);
                ctx$.variants[index]!.total.set(getTotal(orderVariant));
              },
            }}
          />
        </div>
      )}
    />
  );
};

const columns: ColumnDef<Variant>[] = [
  DataTableSelectorHeader(),
  {
    id: "name",
    accessorFn: (original) => original.variant.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama" />
    ),
    cell: ({ renderValue, row }) => (
      <div className="font-medium">
        {products$[row.original.variant.product_id]!.name.get()}{" "}
        {renderValue<string>()}
        <Authenticated permission="kasir-update">
          <PriceEditSheet index={row.index} orderVariant={row.original} />
        </Authenticated>
      </div>
    ),
    size: 1000,
  },
  {
    id: "total",
    accessorFn: (original) => original.total,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Per Satuan" />
    ),
    cell: ({ row }) => toRupiah(row.original.total),
  },
  {
    id: "addon",
    accessorFn: (original) => original.addons.length,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Addon" />
    ),
    cell: ({ row }) => (
      <Authenticated
        permission="kasir-update"
        fallback={() => (
          <Button variant="outline">
            <Memo>{() => row.original.addons.length}</Memo> Addons
          </Button>
        )}
      >
        <AddonButton variant={row} />
      </Authenticated>
    ),
  },
  {
    id: "qty",
    accessorFn: (original) => original.qty,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qty" />
    ),
    cell: ({ row }) => <QtyInput variant={row.original} />,
  },
];

const getTotal = (variant: Variant) => {
  const reduce = variant.addons.reduce((next, a) => {
    return next + a.addon.price * a.qty;
  }, 0);
  return reduce + variant.price;
};

const AddonButton: React.FC<{ variant: Row<Variant> }> = ({ variant }) => {
  const ctx$ = useContext(KasirContext);
  console.log(ctx$.get());
  return (
    <Sheet
      title={
        products$[variant.original.variant.product_id]!.name.get() + " Addon"
      }
      trigger={() => (
        <Button variant="outline">
          <Memo>{() => ctx$.variants[variant.index]!.addons.length}</Memo>{" "}
          Addons
        </Button>
      )}
      content={() => (
        <ProductAddon index={variant.index} variant={variant.original} />
      )}
    />
  );
};

const ProductAddon: React.FC<{ index: number; variant: Variant }> = ({
  index,
  variant,
}) => {
  const ctx$ = useContext(KasirContext);
  const _addons$ = useObservable<Addon[]>([]);

  useMount(async () => {
    const productToAddons = await dexie.productToAddons
      .where("product_id")
      .equals(variant.variant.product_id)
      .toArray();
    const addons = await Promise.all(
      productToAddons.map(async (x) => dexie.addons.get(x.addon_id)),
    );
    _addons$.set(addons.filter((x) => x !== undefined));
  });
  return (
    <>
      <div className="mb-4">
        <Label>Addon Terpiih:</Label>
        <Memo>
          {() => (
            <RenderList
              data={ctx$.variants[index]!.addons.get()}
              renderEmpty={() => (
                <div className="text-sm text-gray-400">
                  Tidak ada addon yang terpilih
                </div>
              )}
              render={(data, i) => (
                <Badge
                  className="cursor-pointer"
                  onClick={() => {
                    ctx$.variants[index]!.addons[i]!.qty.set((p) => p - 1);
                    if (ctx$.variants[index]!.addons[i]!.qty.get() <= 0) {
                      ctx$.variants[index]!.addons.splice(i, 1);
                    }
                    ctx$.variants[index]!.total.set(getTotal(variant));
                  }}
                >
                  {addons$[data.addon.addon_id]!.name.get()} {data.addon.name} -{" "}
                  {data.qty}
                </Badge>
              )}
            />
          )}
        </Memo>
      </div>
      <Memo>
        {() => (
          <RenderList
            data={_addons$.get()}
            render={(data) => (
              <ProductAddonValue
                addon={data}
                onValueSelected={(e) => {
                  const idx = ctx$.variants[index]!.addons.findIndex(
                    (item) => item.addon.id.get() === e.id,
                  );
                  if (idx >= 0) {
                    ctx$.variants[index]!.addons[idx]!.qty.set((p) => p + 1);
                  } else {
                    ctx$.variants[index]!.addons.push({
                      id: generateId(),
                      addon: e,
                      qty: 1,
                    });
                  }

                  ctx$.variants[index]!.total.set(getTotal(variant));
                }}
              />
            )}
            renderEmpty={() => (
              <div className="text-sm text-gray-400">Addon Tidak Tersedia</div>
            )}
          />
        )}
      </Memo>
    </>
  );
};

const ProductAddonValue: React.FC<{
  addon: Addon;
  onValueSelected: (value: AddonValue) => void;
}> = ({ onValueSelected, addon }) => {
  const addonValues$ = useObservable<AddonValue[]>([]);
  useMount(async () => {
    const addonValues = await dexie.addonValues
      .where("addon_id")
      .equals(addon.id)
      .toArray();
    addonValues$.set(addonValues);
  });
  return (
    <Memo>
      {() => (
        <PopoverButton
          data={addonValues$.get()}
          onSelected={onValueSelected}
          renderItem={(e) => (
            <div className="flex w-full items-center justify-between">
              <Label>{e.name}</Label>
              <span className="text-gray-400">{toRupiah(e.price)}</span>
            </div>
          )}
          title={addon.name}
          renderTrigger={() => <Button className="w-full">{addon.name}</Button>}
        />
      )}
    </Memo>
  );
};

const QtyInput: React.FC<{ variant: Variant }> = ({ variant }) => {
  const ctx$ = useContext(KasirContext);
  return (
    <Memo>
      {() => (
        <Input
          defaultValue={variant.qty}
          onBlur={(e) => {
            const p = ctx$.variants
              .get()
              .map((x) =>
                x.id === variant.id ? { ...x, qty: +e.target.value } : x,
              );
            ctx$.variants.set(p);
          }}
        />
      )}
    </Memo>
  );
};

const VariantTable: React.FC<{
  variants: Variant[];
}> = ({ variants }) => {
  const ctx$ = useContext(KasirContext);
  const table = useTable({
    data: variants,
    columns: columns,
  });

  return (
    <div className="space-y-2 p-1">
      <div className="flex h-9 justify-between">
        <DataTableFilterName table={table} />
        <DataTableDeleteSelection
          table={table}
          onDelete={(row) => {
            ctx$.variantsToDelete.set((p) => [
              ...p,
              ...row.map((x) => x.original),
            ]);
            ctx$.variants.set((p) =>
              p.filter((x) => !row.some((e) => e.original.id === x.id)),
            );
          }}
        />
      </div>
      <DataTableContent table={table} />
      <DataTablePagination table={table} />
    </div>
  );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const ctx$ = useContext(KasirContext);
  const variants = useLiveQuery(() =>
    dexie.productVariants
      .where("product_id")
      .equals(product.id)
      .and((variant) => variant.deleted === false)
      .toArray(),
  );

  return (
    <PopoverButton
      data={variants ?? []}
      onSelected={(e) => {
        ctx$.variants.set((p) => [
          ...p,
          {
            id: generateId(),
            variant: e,
            qty: 0,
            addons: [],
            total: e.price,
            price: e.price,
          },
        ]);
      }}
      renderItem={(e) => (
        <div className="flex w-full items-center justify-between">
          <Label>{e.name}</Label>
          <span className="text-gray-400">{toRupiah(e.price)}</span>
        </div>
      )}
      title="Varian"
      renderTrigger={() => (
        <div className="flex aspect-square h-full w-full flex-col overflow-hidden rounded-md shadow-lg">
          <div className="relative flex-1">
            {product.images[0] && product.images[0] !== "" ? (
              <Img src={product.images[0]} alt="" />
            ) : (
              <>No Image</>
            )}
          </div>
          <Label className="line-clamp-1 p-2">{product.name}</Label>
        </div>
      )}
    />
  );
};
