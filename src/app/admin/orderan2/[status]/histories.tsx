import { List } from "@/components/hasan/render-list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDialog } from "@/hooks/useDialog";
import { dexie } from "@/server/local/dexie";
import { SavedOrder, SavedOrderProduct } from "@prisma/client";
import { useLiveQuery } from "dexie-react-hooks";
import { DateTime } from "luxon";
import moment from "moment";
import React, { Fragment } from "react";
import { getDiscount } from "../../pos/kasir2/kasir-product-table";
import { toRupiah } from "@/lib/utils";
import Link from "next/link";
import { LucideEdit } from "lucide-react";
import { SavedProduct } from "../../pos/kasir2/useKasir";
import Receipt from "./receipt";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  newOrders$,
  savedAddons$,
  savedCosts$,
  savedDiscounts$,
  savedOrderProducts$,
  savedOrders$,
} from "@/server/local/db";

const Histories: React.FC<{ orderId: string; histories: string[] }> = ({
  orderId,
  histories,
}) => {
  const [order, setOrder] = React.useState<SavedOrder | null>(null);
  const dialog = useDialog();
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"outline"}>History</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <List
            data={histories
              .reverse()
              .map((x, i) => ({ id: i.toString(), value: x }))}
            render={(data) => (
              <History
                savedOrderId={data.value}
                onSelect={(data) => {
                  setOrder(data);
                  dialog.trigger();
                }}
              />
            )}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet {...dialog.props}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span>Histori</span>
              <Button variant={"ghost"} size={"icon"} asChild>
                <Link href={`/admin/pos/kasir2?orderId=${orderId}`}>
                  <LucideEdit />
                </Link>
              </Button>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Harga</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order?.savedOrderProductsId.map((x) => (
                  <Product savedProductId={x} key={x} />
                ))}
                {order?.discountsId.map((x) => (
                  <Discount price={order.totalProducts} discount={x} key={x} />
                ))}
                {order?.costsId.map((x) => (
                  <Cost
                    key={x}
                    price={order.totalProducts - order.totalDiscounts}
                    cost={x}
                  />
                ))}
                <TableRow>
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell>
                    {toRupiah(
                      (order?.totalProducts ?? 0) -
                        (order?.totalDiscounts ?? 0) +
                        (order?.totalCosts ?? 0),
                    )}
                  </TableCell>
                </TableRow>
                <Paid order={order} />
              </TableBody>
            </Table>
            <div className="flex flex-col gap-1">
              <Receipt
                order={order}
                onDelete={(id) => {
                  const f = async () => {
                    const savedProduct = dexie.savedOrderProducts
                      .where("savedOrderId")
                      .equals(id)
                      .toArray();
                    const savedDiscounts = dexie.savedDiscounts
                      .where("savedOrderId")
                      .equals(id)
                      .toArray();
                    const savedCosts = dexie.savedCosts
                      .where("savedOrderId")
                      .equals(id)
                      .toArray();

                    const [p, d, c] = await Promise.all([
                      savedProduct,
                      savedDiscounts,
                      savedCosts,
                    ]);

                    p.map((x) => {
                      savedOrderProducts$[x.id]!.delete();
                      x.addon.map((a) => {
                        savedAddons$[a]!.delete();
                      });
                    });

                    d.map((x) => {
                      savedDiscounts$[x.id]!.delete();
                    });

                    c.map((x) => {
                      savedCosts$[x.id]!.delete();
                    });

                    savedOrders$[id]!.delete();
                    if (histories.length > 1) {
                      newOrders$[orderId]!.set((p) => ({
                        ...p,
                        savedOrdersId: histories.filter((p) => p != id),
                      }));
                    } else {
                      newOrders$[orderId]!.delete();
                    }
                    dialog.dismiss();
                  };

                  void f();
                }}
              />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Histories;

const Paid: React.FC<{ order: SavedOrder | null }> = ({ order }) => {
  if (!order) return null;
  const total = order.totalProducts - order.totalDiscounts + order.totalCosts;

  return (
    <>
      <TableRow>
        <TableCell colSpan={2}>Bayar</TableCell>
        <TableCell>{toRupiah(order?.paid ?? 0)}</TableCell>
      </TableRow>
      {order.paid < total ? (
        <TableRow>
          <TableCell colSpan={2}>Hutang</TableCell>
          <TableCell>{toRupiah(order.paid - total)}</TableCell>
        </TableRow>
      ) : (
        <TableRow>
          <TableCell colSpan={2}>Kembalian</TableCell>
          <TableCell>{toRupiah(total - order.paid)}</TableCell>
        </TableRow>
      )}
    </>
  );
};

const Cost: React.FC<{ price: number; cost: string }> = ({ price, cost }) => {
  const _cost = useLiveQuery(() => dexie.savedCosts.get(cost));

  if (!_cost) return null;

  return (
    <TableRow>
      <TableCell colSpan={2}>{_cost.name}</TableCell>
      <TableCell>
        {toRupiah(
          getDiscount(_cost.type as "flat" | "percent", price, _cost.value),
        )}
      </TableCell>
    </TableRow>
  );
};

const Discount: React.FC<{ price: number; discount: string }> = ({
  price,
  discount,
}) => {
  const _discount = useLiveQuery(() => dexie.savedDiscounts.get(discount));

  if (!_discount) return null;

  return (
    <TableRow>
      <TableCell colSpan={2}>{_discount.name}</TableCell>
      <TableCell>
        -{" "}
        {toRupiah(
          getDiscount(
            _discount.type as "flat" | "percent",
            price,
            _discount.value,
          ),
        )}
      </TableCell>
    </TableRow>
  );
};

const Product: React.FC<{ savedProductId: string }> = ({ savedProductId }) => {
  const product = useLiveQuery(() =>
    dexie.savedOrderProducts.get(savedProductId),
  );
  if (!product) return null;
  return (
    <>
      <ProductPriceWithAddons product={product} />
      {product.isDiscounted && (
        <TableRow>
          <TableCell colSpan={2}>
            Diskon {product.discountName}{" "}
            {product.discountType === "percent" && (
              <>{product.discountValue}%</>
            )}
          </TableCell>
          <TableCell>
            -{" "}
            {toRupiah(
              getDiscount(
                product.discountType as "flat" | "percent",
                product.price,
                product.discountValue,
              ) * product.qty,
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const ProductPriceWithAddons: React.FC<{
  product: SavedOrderProduct;
}> = ({ product }) => {
  const _addons = useLiveQuery(() =>
    dexie.savedAddons.where("id").anyOf(product.addon).toArray(),
  );
  if (!_addons) return null;

  const distinctAddonsWithQty = Object.values(
    _addons.reduce(
      (acc, addon) => {
        const key = addon.addonValueId;
        if (!acc[key]) {
          acc[key] = { ...addon, qty: 1 };
        } else {
          acc[key].qty += 1;
        }
        return acc;
      },
      {} as Record<string, (typeof _addons)[number] & { qty: number }>,
    ),
  );
  return (
    <>
      <TableRow>
        <TableCell>{product.name}</TableCell>
        <TableCell>{product.qty}</TableCell>
        <TableCell>{toRupiah(product.price * product.qty)}</TableCell>
      </TableRow>

      {distinctAddonsWithQty.map((x) => (
        <TableRow key={x.id}>
          <TableCell>A {x.name}</TableCell>
          <TableCell>
            {x.qty} x {product.qty}
          </TableCell>
          <TableCell>{toRupiah(x.price * x.qty * product.qty)}</TableCell>
        </TableRow>
      ))}
    </>
  );
};

const History: React.FC<{
  savedOrderId: string;
  onSelect: (data: SavedOrder) => void;
}> = ({ savedOrderId: data, onSelect }) => {
  const history = useLiveQuery(() => dexie.savedOrders.get(data));
  if (!history) return null;
  return (
    <DropdownMenuItem onSelect={() => onSelect(history)}>
      {
        //@ts-ignore
        DateTime.fromJSDate(history?.creteadAt).toLocaleString(
          DateTime.DATE_FULL,
          {
            locale: "id",
          },
        )
      }
    </DropdownMenuItem>
  );
};
