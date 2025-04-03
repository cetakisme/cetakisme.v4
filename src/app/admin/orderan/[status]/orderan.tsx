/// <reference types="web-bluetooth" />

"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTableColumnHeader } from "@/hooks/Table/DataColumnHeader";
import { DataTableContent } from "@/hooks/Table/DataTableContent";
import { DataTablePagination } from "@/hooks/Table/DataTablePagination";
import { useTable } from "@/hooks/Table/useTable";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addons$,
  addonValues$,
  customer$,
  expenses$,
  generateId,
  materials$,
  orderHistories$,
  orderMaterials$,
  orderProducts$,
  orders$,
  orderStatuses,
  products$,
  productVariants$,
  suppliers$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import {
  Cost,
  Product,
  ProductVariant,
  type Discount,
  type Order,
  type OrderHistory,
  type OrderMaterial,
  type OrderProduct,
  type OrderVariant,
} from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import { useLiveQuery } from "dexie-react-hooks";
import React, { createContext, useContext } from "react";
import moment from "moment";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { id } from "date-fns/locale";
import {
  Memo,
  useMount,
  useObservable,
  useObserveEffect,
} from "@legendapp/state/react";
import { Badge } from "@/components/ui/badge";
import { PopoverButton } from "@/components/hasan/popover-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LucideDot,
  LucideLink,
  LucidePlus,
  MoreHorizontal,
  Scroll,
} from "lucide-react";
import { DataTableFilterName } from "@/hooks/Table/DataTableFilterName";
import { DataTableViewOptions } from "@/hooks/Table/DataTableViewOptions";
import Sheet from "@/components/hasan/sheet";
import { useDialog } from "@/hooks/useDialog";
import InputWithLabel from "@/components/hasan/input-with-label";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import type { DialogProps } from "@radix-ui/react-dialog";
import RenderList, { List } from "@/components/hasan/render-list";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/hasan/combobox";
import Title from "@/components/hasan/title";
import { Observable } from "@legendapp/state";
import { toRupiah } from "@/lib/utils";
import { getHistoryReceipt } from "../../resi/[id]/resi";
import { toast } from "sonner";
import Authenticated from "@/components/hasan/auth/authenticated";
import { DateTime } from "luxon";
import { DB } from "@/lib/supabase/supabase";
import ResiDialog from "@/components/hasan/resi-dialog";

const columns: ColumnDef<Order & { status: string }>[] = [
  {
    id: "tanggal",
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal" />
    ),
    cell: ({ row }) =>
      DateTime.fromJSDate(row.original.created_at).toLocaleString(
        DateTime.DATE_MED,
      ),
  },
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
        <Authenticated
          permission={row.original.status + "-update"}
          fallback={() => (
            <Badge className="cursor-pointer">
              {row.original.payment_status}
            </Badge>
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge className="cursor-pointer">
                {row.original.payment_status}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="font-medium">
                Status
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <List
                data={["DP", "Cicil", "Lunas"].map((x) => ({ id: x }))}
                render={(data) => (
                  <DropdownMenuItem
                    onClick={() =>
                      orders$[row.original.id]!.payment_status.set(data.id)
                    }
                  >
                    {data.id}
                  </DropdownMenuItem>
                )}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </Authenticated>
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
    cell: ({ row }) => (
      <Authenticated
        permission={row.original.status + "-update"}
        fallback={() => (
          <Button variant="outline">
            {moment(row.original.deadline).locale("id").fromNow()}
          </Button>
        )}
      >
        <Deadline order={row.original} />
      </Authenticated>
    ),
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

type C_Order = React.FC<{ order: Order & { status: string } }>;

interface IOrderHistoryContext {
  id: string;
}

const OrderHistoryContext = createContext<Observable<IOrderHistoryContext>>(
  undefined as any,
);

const Actions: C_Order = ({ order }) => {
  const linkDialog = useDialog();
  const AturBarangDialog = useDialog();
  const detailDialog = useDialog();
  const untungDialog = useDialog();

  const orderHistory = useObservable<IOrderHistoryContext>({ id: "" });

  return (
    <OrderHistoryContext.Provider value={orderHistory}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="font-semibold">Opsi</DropdownMenuItem>
          <DropdownMenuSeparator />
          <OrderHistories
            order={order}
            onSelect={(e) => {
              orderHistory.id.set(e.id);
              detailDialog.trigger();
            }}
          />
          <DropdownMenuItem onClick={() => untungDialog.trigger()}>
            Total Keuntungan
          </DropdownMenuItem>
          <Authenticated permission={order.status + "-update"}>
            <DropdownMenuItem asChild>
              <Link href={`/admin/pos/kasir/edit?id=${order.id}`}>Ubah</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={AturBarangDialog.trigger}>
              Atur Barang
            </DropdownMenuItem>
            <DropdownMenuItem onClick={linkDialog.trigger}>
              Tambah Link
            </DropdownMenuItem>
          </Authenticated>
          {/* <DropdownMenuItem asChild>
          <Button variant="destructive" className="w-full justify-start">
            Hapus
          </Button>
        </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet
        {...untungDialog.props}
        title="Keuntungan"
        content={() => <Keuntungan order={order} />}
      />
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
        {...linkDialog.props}
      />
      <AturBarangSheet order={order} {...AturBarangDialog.props} />
      <OrderHistoryDetail {...detailDialog.props} />
    </OrderHistoryContext.Provider>
  );
};

const GetProductHpp = async (
  orderProduct: OrderProduct,
  variant: ProductVariant,
  product: DB<"Product">,
) => {
  if (orderProduct.type === "vendor") return orderProduct.pay;
  if (variant.costOfGoods !== 0) return variant.costOfGoods * orderProduct.qty;
  return product.costOfGoods * orderProduct.qty;
};

const Keuntungan: React.FC<{ order: Order }> = ({ order }) => {
  const lastHistory = useObservable<OrderHistory | null>(null);
  const products = useObservable<{ id: string; name: string; price: number }[]>(
    [],
  );
  const pengeluaran = useObservable(0);

  const materials = useObservable<
    { id: string; name: string; price: number }[]
  >([]);

  useMount(async () => {
    const histories = await dexie.orderHistory
      .where("orderId")
      .equals(order.id)
      .sortBy("createdAt");
    const last = histories.at(-1);
    if (last) {
      lastHistory.set(last);
      console.log(last);
    }

    const _products = await dexie.orderProducts
      .where("orderId")
      .equals(order.id)
      .toArray();

    const p = await Promise.all(
      _products.map(async (x) => {
        const variant = productVariants$[x.variantId]!.get();
        const product = products$[x.productId]!.get();

        const price = await GetProductHpp(x, variant, product);
        return {
          id: x.id,
          name: product.name + " " + variant.name,
          price: price,
        };
      }),
    );

    products.set(p);

    const _materials = await dexie.orderMaterials
      .where("orderId")
      .equals(order.id)
      .toArray();

    const m = _materials.map((x) => ({
      id: x.id,
      name: materials$[x.materialId]!.name.get(),
      price:
        x.type === "vendor"
          ? x.pay
          : materials$[x.materialId]!.costOfGoods.get(),
    }));

    materials.set(m);

    pengeluaran.set(
      p.reduce((sum, a) => sum + a.price, 0) +
        m.reduce((sum, a) => sum + a.price, 0),
    );
  });

  return (
    <Table>
      <TableBody>
        <Memo>
          {() => (
            <List
              data={products.get()}
              render={(data) => (
                <TableRow>
                  <TableCell className="font-medium">{data.name}</TableCell>
                  <TableCell>{toRupiah(data.price)}</TableCell>
                </TableRow>
              )}
            />
          )}
        </Memo>
        <Memo>
          {() => (
            <List
              data={materials.get()}
              render={(data) => (
                <TableRow>
                  <TableCell className="font-medium">{data.name}</TableCell>
                  <TableCell>{toRupiah(data.price)}</TableCell>
                </TableRow>
              )}
            />
          )}
        </Memo>
        <TableRow>
          <TableCell>Omset</TableCell>
          <TableCell>
            <Memo>
              {() => {
                const history = lastHistory.get();
                if (!history) return;
                return toRupiah(history.total);
              }}
            </Memo>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Pengeluaran</TableCell>
          <TableCell>
            <Memo>{() => <>{toRupiah(pengeluaran.get())}</>}</Memo>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bersih</TableCell>
          <TableCell>
            <Memo>
              {() => {
                const history = lastHistory.get();
                if (!history) return;
                return toRupiah(history.total - pengeluaran.get());
              }}
            </Memo>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

const OrderHistoryDetail: React.FC<DialogProps> = ({ ...props }) => {
  return (
    <Sheet
      {...props}
      title="Order History"
      style={{ maxWidth: "500px" }}
      content={() => <OrderHistoryDetailContent />}
    />
  );
};

const OrderHistoryDetailContent = () => {
  const ctx$ = useContext(OrderHistoryContext);

  const variants = useObservable<OrderVariant[]>([]);
  const discounts = useObservable<Discount[]>([]);
  const costs = useObservable<Cost[]>([]);

  useObserveEffect(async () => {
    const [v, d, c] = await Promise.all([
      dexie.orderVariants
        .where("orderHistoryId")
        .equals(ctx$.id.get() ?? "")
        .and((o) => !o.deleted)
        .toArray(),
      dexie.discounts
        .where("orderHistoryId")
        .equals(ctx$.id.get() ?? "")
        .and((o) => !o.deleted)
        .toArray(),
      dexie.costs
        .where("orderHistoryId")
        .equals(ctx$.id.get() ?? "")
        .and((o) => !o.deleted)
        .toArray(),
    ]);

    variants.set(v);
    discounts.set(d);
    costs.set(c);
  });

  const resiDialog = useDialog();

  return (
    <ScrollArea className="h-screen">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Barang</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Memo>
            {() => (
              <List
                data={variants.get()}
                render={(data) => <OrderVariantItem orderVariant={data} />}
              />
            )}
          </Memo>
          <Memo>
            {() => {
              const orderHistory = orderHistories$[ctx$.id.get()]!.get();
              if (!orderHistory) return;
              return (
                <List
                  data={discounts.get()}
                  render={(data) => (
                    <TableRow>
                      <TableCell className="font-medium" colSpan={2}>
                        Diskon {data.name}{" "}
                        {data.type === "percent" && data.value + "%"}
                      </TableCell>
                      <TableCell colSpan={2} className="text-right">
                        -{" "}
                        {data.type === "percent"
                          ? toRupiah(
                              orderHistory.totalBeforeDiscount *
                                data.value *
                                0.01,
                            )
                          : toRupiah(data.value)}
                      </TableCell>
                    </TableRow>
                  )}
                />
              );
            }}
          </Memo>
          <Memo>
            {() => {
              const orderHistory = orderHistories$[ctx$.id.get()]!.get();
              if (!orderHistory) return;
              return (
                <List
                  data={costs.get()}
                  render={(data) => (
                    <TableRow>
                      <TableCell className="font-medium" colSpan={2}>
                        Biaya {data.name}{" "}
                        {data.type === "percent" && data.value + "%"}
                      </TableCell>
                      <TableCell colSpan={2} className="text-right">
                        {data.type === "percent"
                          ? toRupiah(
                              orderHistory.totalAfterDiscount *
                                data.value *
                                0.01,
                            )
                          : toRupiah(data.value)}
                      </TableCell>
                    </TableRow>
                  )}
                />
              );
            }}
          </Memo>
          <TableRow>
            <TableCell colSpan={2} className="font-medium">
              Total
            </TableCell>
            <TableCell colSpan={2} className="text-right">
              <Memo>
                {toRupiah(orderHistories$[ctx$.id.get()]!.total.get())}
              </Memo>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={2} className="font-medium">
              Bayar {"("}
              <Memo>
                {orderHistories$[ctx$.id.get()]!.payment_provider.get()}
              </Memo>
              {")"}
            </TableCell>
            <TableCell colSpan={2} className="text-right">
              <Memo>
                {toRupiah(orderHistories$[ctx$.id.get()]!.paid.get())}
              </Memo>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={2} className="font-medium">
              Kembalian
            </TableCell>
            <TableCell colSpan={2} className="text-right">
              <Memo>
                {orderHistories$[ctx$.id.get()]!.paid.get() >
                orderHistories$[ctx$.id.get()]!.total.get()
                  ? toRupiah(
                      orderHistories$[ctx$.id.get()]!.paid.get() -
                        orderHistories$[ctx$.id.get()]!.total.get(),
                    )
                  : 0}
              </Memo>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <div className="mt-8 space-y-2">
        <Button className="w-full" onClick={() => resiDialog.trigger()}>
          Lihat Resi
        </Button>
        <ResiDialog
          history={orderHistories$[ctx$.id.get()]!.get()}
          {...resiDialog.props}
        />
        <Button
          className="w-full"
          onClick={async () => {
            const svg = await getHistoryReceipt(ctx$.id.get(), {
              cpl: 42,
              encoding: "multilingual",
            });

            downloadPNGFromSVG(svg, (pngUrl) => {
              sendToPrinter(pngUrl);
            });
          }}
        >
          Print Resi
        </Button>
        <Button
          className="w-full"
          onClick={async () => {
            const svg = await getHistoryReceipt(ctx$.id.get(), {
              cpl: 42,
              encoding: "multilingual",
            });

            downloadPNGFromSVG(svg, (pngUrl) => {
              const printWindow = window.open("");
              if (printWindow) {
                printWindow.document.write(
                  `<img src="${pngUrl}" onload="window.print(); window.close();" />`,
                );
                printWindow.document.close();
              }
            });
          }}
        >
          Print Resi 2
        </Button>
        <Button
          className="w-full"
          onClick={async () => {
            const svg = await getHistoryReceipt(ctx$.id.get(), {
              cpl: 42,
              encoding: "multilingual",
            });

            const history = orderHistories$[ctx$.id.get()]!.get();
            const order = orders$[history.orderId]!.get();
            const customer = customer$[order.customer_id]!.get();

            downloadPNGFromSVG(svg, (pngUrl) => {
              const link = document.createElement("a");
              link.href = pngUrl;
              link.download = `Resi ${customer.name} - ${moment(history.created_at).format("DD MMM YYYY")}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            });
          }}
        >
          Download Resi
        </Button>
      </div>
    </ScrollArea>
  );
};

const sendToPrinter = async (imageUrl: string) => {
  try {
    // Request the Bluetooth device
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ["battery_service"], // Some printers expose battery service
    });

    const server = await device.gatt?.connect();
    console.log("Connected to printer", server);

    // Convert image to raw bytes (needed for printing)
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Send raw image data to the printer
    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    reader.onloadend = async () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);

      // Assuming printer has a writable characteristic
      const service = await server?.getPrimaryService("battery_service");
      const characteristic = await service?.getCharacteristic("battery_level"); // Change this
      await characteristic?.writeValue(data);

      // console.log("Image sent to printer!");
      toast.success("Print Berhasil!");
    };
  } catch (error) {
    // console.error("Printing error:", error);
    toast.error("Tidak dapat terhubung ke printer!");
  }
};

const downloadPNGFromSVG = (
  svgString: string,
  cb: (pngUrl: string) => void,
) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const img = new Image();
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    // Set canvas size to match SVG
    canvas.width = img.width || 500;
    canvas.height = img.height || 500;

    ctx?.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    // Convert canvas to PNG and trigger download
    const pngUrl = canvas.toDataURL("image/png");
    cb(pngUrl);
  };

  img.src = url;
};

const OrderVariantItem: React.FC<{ orderVariant: OrderVariant }> = ({
  orderVariant,
}) => {
  const productId = productVariants$[orderVariant.variant_id]!.product_id.get();
  const price = orderVariant.price;

  const addons = useLiveQuery(() =>
    dexie.orderVariantAddons
      .where("orderVariantId")
      .equals(orderVariant.id)
      .toArray(),
  );

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <Memo>
            {() => (
              <>
                {products$[productId]!.name.get()}{" "}
                {productVariants$[orderVariant.variant_id]!.name.get()}
              </>
            )}
          </Memo>
        </TableCell>
        <TableCell>{orderVariant.qty}</TableCell>
        <TableCell>{toRupiah(price)}</TableCell>
        <TableCell className="text-right">
          {toRupiah(orderVariant.qty * price)}
        </TableCell>
      </TableRow>
      <List
        data={addons}
        render={(data) => (
          <TableRow>
            <TableCell>
              <Memo>{addonValues$[data.addonValueId]!.name.get()}</Memo>
            </TableCell>
            <TableCell>{data.qty + " x " + orderVariant.qty}</TableCell>
            <TableCell>
              <Memo>
                {toRupiah(addonValues$[data.addonValueId]!.price.get())}
              </Memo>
            </TableCell>

            <TableCell className="text-right">
              <Memo>
                {toRupiah(
                  addonValues$[data.addonValueId]!.price.get() *
                    data.qty *
                    orderVariant.qty,
                )}
              </Memo>
            </TableCell>
          </TableRow>
        )}
      />
    </>
  );
};

const OrderHistories: React.FC<{
  order: Order;
  onSelect: (e: OrderHistory) => void;
}> = ({ order, onSelect }) => {
  const histories = useLiveQuery(() =>
    dexie.orderHistory
      .where("orderId")
      .equals(order.id)
      .reverse()
      .sortBy("created_at"),
  );

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>History</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {histories?.map((x) => (
            <DropdownMenuItem key={x.id} onClick={() => onSelect(x)}>
              {moment(x.created_at).format("DD MMM YYYY")}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
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
        <ScrollArea className="h-full pb-12 pr-8">
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
        </ScrollArea>
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
                      materialId: "",
                      deleted: true,
                      orderId: "",
                      pay: 0,
                      qty: 0,
                      supplierId: "",
                      type: "",
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
                          targetId: "",
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
                            targetId: data.id,
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
                        materials$[data.materialId]?.qty.set((p) => {
                          let newQty = p + data.qty;
                          return newQty - +e.target.value;
                        });
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
            createdAt: DateTime.now().setZone("Asia/Singapore").toISO()!,
            inOut: "out",
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
                        targetId: data.id,
                        createdAt: DateTime.now()
                          .setZone("Asia/Singapore")
                          .toISO()!,
                        expense: 0,
                        notes: "",
                        type: "",
                        updatedAt: DateTime.now()
                          .setZone("Asia/Singapore")
                          .toISO()!,
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
                            targetId: data.id,
                            deleted: false,
                            createdAt:
                              p?.createdAt ??
                              DateTime.now().setZone("Asia/Singapore").toISO()!,
                            expense: +e.target.value,
                            notes: `Bayar ${products$[data.productId]!.name.get()} ${productVariants$[data.variantId]!.name.get()} Ke ${suppliers$[data.supplierId]!.name.get()}`,
                            type: "product",
                            updatedAt: DateTime.now()
                              .setZone("Asia/Singapore")
                              .toISO()!,
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
                        productVariants$[data.variantId]?.qty.set((p) => {
                          let newQty = p + data.qty;
                          return newQty - +e.target.value;
                        });
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
            createdAt: DateTime.now().setZone("Asia/Singapore").toISO()!,
            inOut: "out",
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
    <Authenticated
      permission={order.status + "-update"}
      fallback={() => <Button variant="outline">{order.order_status}</Button>}
    >
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
    </Authenticated>
  );
};

const Deadline: C_Order = ({ order }) => {
  return (
    <Memo>
      {() => {
        const deadline =
          orders$[order.id]!.deadline.get() ?? DateTime.now().toISO()!;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {moment(deadline).locale("id").fromNow()}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                locale={id}
                selected={DateTime.fromISO(deadline)
                  .setZone("Asia/Singapore")
                  .toJSDate()}
                onSelect={(date: Date | undefined) => {
                  if (!date) return;
                  orders$[order.id]!.deadline.set(
                    DateTime.fromJSDate(date)
                      .setZone("Asia/Singapore")
                      .toISO()!,
                  );
                }}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
        );
      }}
    </Memo>
  );
};

const Orderan: React.FC<{ status: string }> = ({ status }) => {
  const orders = useLiveQuery(() =>
    dexie.orders
      .where("order_status")
      .equals(status)
      .reverse()
      .sortBy("created_at"),
  );
  const table = useTable({
    data: orders?.map((x) => ({ ...x, status: status })) ?? [],
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
