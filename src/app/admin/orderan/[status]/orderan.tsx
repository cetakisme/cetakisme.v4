"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { useTable } from "@/hooks/Table/useTable";
import {
  customer$,
  expenses$,
  generateId,
  materials$,
  orderMaterials$,
  orderProducts$,
  orders$,
  orderStatuses,
  products$,
  productVariants$,
  suppliers$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import type { Order, OrderMaterial, OrderProduct } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import React from "react";
import moment from "moment";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { id } from "date-fns/locale";
import { Memo } from "@legendapp/state/react";
import { Badge } from "@/components/ui/badge";
import { PopoverButton } from "@/components/hasan/popover-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LucideDot,
  LucideLink,
  LucidePlus,
  MoreHorizontal,
} from "lucide-react";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import Sheet from "@/components/hasan/sheet";
import { useDialog } from "@/hooks/useDialog";
import InputWithLabel from "@/components/hasan/input-with-label";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import type { DialogProps } from "@radix-ui/react-dialog";
import RenderList from "@/components/hasan/render-list";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/hasan/combobox";
import { toast } from "sonner";
import Title from "@/components/hasan/title";

const columns: ColumnDef<Order>[] = [
  {
    id: "name",
    accessorFn: (original) => customer$[original.customer_id]?.name.get(),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cutomer" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Memo>
          {() => (
            <div className="font-medium">
              {customer$[row.original.customer_id]?.name.get()}
            </div>
          )}
        </Memo>
        <Badge>{row.original.payment_status}</Badge>
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "order_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <Status order={row.original} />,
  },
  {
    id: "deadline",
    accessorFn: (original) => original.deadline,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deadline" />
    ),
    cell: ({ row }) => <Deadline order={row.original} />,
  },
  {
    id: "drive",
    accessorFn: (original) => original.driveUrl,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Drive" />
    ),
    cell: ({ row }) => {
      if (row.original.driveUrl === "" || row.original.driveUrl === undefined)
        return "-";
      return (
        <Button asChild variant="outline">
          <Link href={row.original.driveUrl} target="_blank">
            <LucideLink /> GDrive Link
          </Link>
        </Button>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions order={row.original} />,
  },
];

type C_Order = React.FC<{ order: Order }>;

const Actions: C_Order = ({ order }) => {
  const detailDialog = useDialog();
  const AturBarangDialog = useDialog();
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
          <DropdownMenuItem>Detail</DropdownMenuItem>
          <DropdownMenuItem onClick={AturBarangDialog.trigger}>
            Atur Barang
          </DropdownMenuItem>
          <DropdownMenuItem onClick={detailDialog.trigger}>
            Tambah Link
          </DropdownMenuItem>
          {/* <DropdownMenuItem asChild>
          <Button variant="destructive" className="w-full justify-start">
            Hapus
          </Button>
        </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet
        title="Detail Order"
        content={() => (
          <InputWithLabel
            label="Link"
            inputProps={{
              defaultValue: order.driveUrl,
              onBlur: (e) => orders$[order.id]!.driveUrl.set(e.target.value),
            }}
          />
        )}
        {...detailDialog.props}
      />
      <AturBarangSheet order={order} {...AturBarangDialog.props} />
    </>
  );
};

const AturBarangSheet: React.FC<DialogProps & { order: Order }> = ({
  order,
  ...props
}) => {
  return (
    <Sheet
      {...props}
      title="Atur Barang"
      content={() => (
        <div className="space-y-12">
          <div className="space-y-2">
            <Label className="font-bold">Produk</Label>
            <OrderProucts order={order} />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Bahan</Label>
            <OrderMaterials order={order} />
          </div>
        </div>
      )}
    />
  );
};

const OrderMaterials: React.FC<{ order: Order }> = ({ order }) => {
  const orderMaterials = useLiveQuery(() =>
    dexie.orderMaterials
      .where("orderId")
      .equals(order.id)
      .and((a) => !a.deleted)
      .toArray(),
  );
  const materials = useLiveQuery(() =>
    dexie.materials.filter((a) => !a.deleted).toArray(),
  );
  return (
    <>
      <RenderList
        className="space-y-4"
        data={orderMaterials ?? []}
        getKey={(data) => data.id}
        render={(data, index) => (
          <div className={`w-full space-y-2 border-b pb-4`}>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={"destructive"}
                  size={"icon"}
                  className="h-4 w-4"
                  onClick={() => {
                    if (data.type === "vendor") {
                      expenses$[data.id]!.set((p) => ({
                        ...p,
                        deleted: true,
                        expense: 0,
                        notes: "",
                        type: "",
                      }));
                    }

                    if (data.type === "inventory") {
                      materials$[data.materialId]?.qty.set((p) => p + data.qty);
                    }

                    orderMaterials$[data.id]!.set((p) => ({
                      ...p,
                      orderId: "",
                      pay: 0,
                      deleted: true,
                      productId: "",
                      supplierId: "",
                      qty: 0,
                      type: "",
                      variantId: "",
                    }));
                  }}
                >
                  <LucideDot />
                </Button>
                <Memo>
                  {() => (
                    <Label>{materials$[data.materialId]!.name.get()}</Label>
                  )}
                </Memo>
              </div>
              {materials$[data.materialId]!.aset.get() === false && (
                <Checkbox
                  checked={data.type === "vendor"}
                  onCheckedChange={(e) => {
                    if (e === true) {
                      materials$[data.materialId]?.qty.set((p) => p + data.qty);

                      orderMaterials$[data.id]!.set((p) => {
                        return {
                          ...p,
                          type: "vendor",
                          qty: 0,
                        };
                      });

                      if (expenses$[data.id]?.get() === undefined) {
                        expenses$[data.id]!.set({
                          id: data.id,
                          deleted: false,
                          createdAt: new Date().toISOString(),
                          expense: 0,
                          notes: "",
                          type: "",
                          updatedAt: new Date().toISOString(),
                        });
                      } else {
                        expenses$[data.id]!.set((p) => ({
                          ...p,
                          deleted: false,
                          type: "bahan",
                        }));
                      }

                      return;
                    }

                    if (e === false) {
                      orderMaterials$[data.id]!.set((p) => {
                        return {
                          ...p,
                          type: "inventory",
                          qty: 0,
                        };
                      });

                      expenses$[data.id]!.set((p) => ({
                        ...p,
                        deleted: true,
                        expense: 0,
                        notes: "",
                        type: "",
                      }));

                      return;
                    }
                  }}
                />
              )}
            </div>

            {materials$[data.materialId]!.aset.get() === false && (
              <>
                {data.type === "vendor" ? (
                  <>
                    <InputWithLabel
                      label="Bayar"
                      inputProps={{
                        defaultValue: data.pay,
                        onBlur: (e) => {
                          orderMaterials$[data.id]!.pay.set(+e.target.value);
                          expenses$[data.id]!.set((p) => ({
                            id: data.id,
                            deleted: false,
                            createdAt: p?.createdAt ?? new Date().toISOString(),
                            expense: +e.target.value,
                            notes: `Bayar ${materials$[data.materialId]!.name.get()} Ke ${suppliers$[data.supplierId]!.name.get()}`,
                            type: "bahan",
                            updatedAt: new Date().toISOString(),
                          }));
                        },
                      }}
                    />
                    <SupplierSelectorMaterial data={data} />
                  </>
                ) : (
                  <InputWithLabel
                    label="Qty"
                    inputProps={{
                      defaultValue: data.qty,
                      onBlur: (e) => {
                        materials$[data.materialId]?.qty.set(
                          (p) => p - (+e.target.value - data.qty),
                        );
                        orderMaterials$[data.id]!.qty.set(+e.target.value);
                      },
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
      />
      <PopoverButton
        title="Order Produk"
        onSelected={(e) => {
          const id = generateId();
          orderMaterials$[id]!.set({
            deleted: false,
            id: id,
            orderId: order.id,
            materialId: e.id,
            qty: 0,
            type: "inventory",
            supplierId: "",
            pay: 0,
          });
        }}
        data={materials ?? []}
        renderItem={(data) => data.name}
        renderTrigger={() => (
          <Button>
            <LucidePlus /> Tambah Order Bahan
          </Button>
        )}
      />
    </>
  );
};

const OrderProucts: React.FC<{ order: Order }> = ({ order }) => {
  const orderProducts = useLiveQuery(() =>
    dexie.orderProducts
      .where("orderId")
      .equals(order.id)
      .and((a) => !a.deleted)
      .toArray(),
  );
  const products = useLiveQuery(() =>
    dexie.products.filter((a) => !a.deleted).toArray(),
  );
  return (
    <>
      <RenderList
        className="space-y-4"
        data={orderProducts ?? []}
        getKey={(data) => data.id}
        render={(data, index) => (
          <div className={`w-full space-y-2 border-b pb-4`}>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={"destructive"}
                  size={"icon"}
                  className="h-4 w-4"
                  onClick={() => {
                    if (data.type === "vendor") {
                      expenses$[data.id]!.set((p) => ({
                        ...p,
                        deleted: true,
                        expense: 0,
                        notes: "",
                        type: "",
                      }));
                    }

                    if (data.type === "inventory") {
                      productVariants$[data.variantId]?.qty.set(
                        (p) => p + data.qty,
                      );
                    }

                    orderProducts$[data.id]!.set((p) => ({
                      ...p,
                      orderId: "",
                      pay: 0,
                      deleted: true,
                      productId: "",
                      supplierId: "",
                      qty: 0,
                      type: "",
                      variantId: "",
                    }));
                  }}
                >
                  <LucideDot />
                </Button>
                <Memo>
                  {() => <Label>{products$[data.productId]!.name.get()}</Label>}
                </Memo>
              </div>
              <Checkbox
                checked={data.type === "vendor"}
                onCheckedChange={(e) => {
                  if (e === true) {
                    productVariants$[data.variantId]?.qty.set(
                      (p) => p + data.qty,
                    );

                    orderProducts$[data.id]!.set((p) => {
                      return {
                        ...p,
                        type: "vendor",
                        qty: 0,
                      };
                    });

                    if (expenses$[data.id]?.get() === undefined) {
                      expenses$[data.id]!.set({
                        id: data.id,
                        deleted: false,
                        createdAt: new Date().toISOString(),
                        expense: 0,
                        notes: "",
                        type: "",
                        updatedAt: new Date().toISOString(),
                      });
                    } else {
                      expenses$[data.id]!.set((p) => ({
                        ...p,
                        deleted: false,
                      }));
                    }

                    return;
                  }

                  if (e === false) {
                    orderProducts$[data.id]!.set((p) => {
                      return {
                        ...p,
                        type: "inventory",
                        qty: 0,
                      };
                    });

                    expenses$[data.id]!.set((p) => ({
                      ...p,
                      deleted: true,
                      expense: 0,
                      notes: "",
                      type: "",
                    }));

                    return;
                  }
                }}
              />
            </div>
            <VariantSelector data={data} />
            {data.variantId !== "" && (
              <>
                {data.type === "vendor" ? (
                  <>
                    <InputWithLabel
                      label="Bayar"
                      inputProps={{
                        defaultValue: data.pay,
                        onBlur: (e) => {
                          orderProducts$[data.id]!.pay.set(+e.target.value);
                          expenses$[data.id]!.set((p) => ({
                            id: data.id,
                            deleted: false,
                            createdAt: p?.createdAt ?? new Date().toISOString(),
                            expense: +e.target.value,
                            notes: `Bayar ${products$[data.productId]!.name.get()} ${productVariants$[data.variantId]!.name.get()} Ke ${suppliers$[data.supplierId]!.name.get()}`,
                            type: "product",
                            updatedAt: new Date().toISOString(),
                          }));
                        },
                      }}
                    />
                    <SupplierSelector data={data} />
                  </>
                ) : (
                  <InputWithLabel
                    label="Qty"
                    inputProps={{
                      defaultValue: data.qty,
                      onBlur: (e) => {
                        productVariants$[data.variantId]?.qty.set(
                          (p) => p - (+e.target.value - data.qty),
                        );
                        orderProducts$[data.id]!.qty.set(+e.target.value);
                      },
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
      />
      <PopoverButton
        title="Order Produk"
        onSelected={(e) => {
          const id = generateId();
          orderProducts$[id]!.set({
            deleted: false,
            id: id,
            orderId: order.id,
            productId: e.id,
            qty: 0,
            type: "inventory",
            supplierId: "",
            variantId: "",
            pay: 0,
          });
        }}
        data={products ?? []}
        renderItem={(data) => data.name}
        renderTrigger={() => (
          <Button>
            <LucidePlus /> Tambah Order Produk
          </Button>
        )}
      />
    </>
  );
};

const SupplierSelectorMaterial: React.FC<{ data: OrderMaterial }> = ({
  data,
}) => {
  const suppliers = useLiveQuery(() =>
    dexie.suppliers.filter((x) => !x.deleted).toArray(),
  );

  return (
    <Combobox
      renderSelected={() => (
        <Memo>
          {() => {
            const id = orderMaterials$[data.id]!.supplierId.get();
            return suppliers$[id]?.name.get() ?? "Pilih Suplier";
          }}
        </Memo>
      )}
      title="Varian"
      onSelected={(e) => {
        orderMaterials$[data.id]!.supplierId.set(e.id);
        expenses$[data.id]?.notes.set(
          `Bayar ${materials$[data.materialId]!.name.get()} Ke ${e.name}`,
        );
      }}
      data={suppliers ?? []}
      renderItem={(data) => data.name}
    />
  );
};

const SupplierSelector: React.FC<{ data: OrderProduct }> = ({ data }) => {
  const suppliers = useLiveQuery(() =>
    dexie.suppliers.filter((x) => !x.deleted).toArray(),
  );

  return (
    <Combobox
      renderSelected={() => (
        <Memo>
          {() => {
            const id = orderProducts$[data.id]!.supplierId.get();
            return suppliers$[id]?.name.get() ?? "Pilih Suplier";
          }}
        </Memo>
      )}
      title="Varian"
      onSelected={(e) => {
        orderProducts$[data.id]!.supplierId.set(e.id);
        expenses$[data.id]?.notes.set(
          `Bayar ${products$[data.productId]!.name.get()} ${productVariants$[data.variantId]!.name.get()} Ke ${suppliers$[data.supplierId]!.name.get()}`,
        );
      }}
      data={suppliers ?? []}
      renderItem={(data) => data.name}
    />
  );
};

const VariantSelector: React.FC<{ data: OrderProduct }> = ({ data }) => {
  const variants = useLiveQuery(() =>
    dexie.productVariants
      .where("product_id")
      .equals(data.productId)
      .filter((x) => !x.deleted)
      .toArray(),
  );

  return (
    <Combobox
      renderSelected={() => (
        <Memo>
          {() => {
            const id = orderProducts$[data.id]!.variantId.get();
            return productVariants$[id]?.name.get() ?? "Pilih Varian";
          }}
        </Memo>
      )}
      title="Varian"
      onSelected={(e) => {
        if (data.type !== "vendor") {
          productVariants$[data.variantId]!.qty.set((p) => p + data.qty);
          productVariants$[e.id]!.qty.set((p) => p - data.qty);
        }

        orderProducts$[data.id]!.variantId.set(e.id);
      }}
      data={variants ?? []}
      renderItem={(data) => data.name}
    />
  );
};

const Status: C_Order = ({ order }) => {
  return (
    <PopoverButton
      data={orderStatuses.map((x) => ({
        name: x,
      }))}
      onSelected={(e) => {
        orders$[order.id]!.order_status.set(e.name);
      }}
      renderItem={(data) => <div className="font-medium">{data.name}</div>}
      title="Order Status"
      renderTrigger={() => (
        <Button variant="outline">{order.order_status}</Button>
      )}
    />
  );
};

const Deadline: C_Order = ({ order }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {moment(order.deadline).locale("id").fromNow()}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="single"
          locale={id}
          selected={order.deadline ? new Date(order.deadline) : new Date()}
          onSelect={(date: Date | undefined) => {
            if (!date) return;
            date.setHours(31, 59, 59, 59);
            orders$[order.id]!.deadline.set(date.toISOString());
          }}
          className="rounded-md border"
        />
      </PopoverContent>
    </Popover>
  );
};

const Orderan: React.FC<{ status: string }> = ({ status }) => {
  const orders = useLiveQuery(() =>
    dexie.orders.where("order_status").equals(status).toArray(),
  );
  const table = useTable({
    data: orders ?? [],
    columns: columns,
  });

  const title = status
    .split("")
    .map((x, i) => (i === 0 ? x.toUpperCase() : x))
    .join("");

  return (
    <ScrollArea className="h-screen p-8">
      <Title>{title}</Title>
      <div className="space-y-2">
        <div className="flex h-9 justify-between gap-2">
          <DataTableFilterName table={table} />
          <div className="flex gap-2">
            <DataTableViewOptions table={table} />
          </div>
        </div>
        <DataTableContent table={table} />
        <DataTablePagination table={table} />
      </div>
    </ScrollArea>
  );
};

export default Orderan;
