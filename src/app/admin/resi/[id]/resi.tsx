"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { toRupiah } from "@/lib/utils";
import {
  addons$,
  addonValues$,
  products$,
  productVariants$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { Memo, useMount, useObservable } from "@legendapp/state/react";
import moment from "moment";
import React from "react";
import receiptline, { Printer } from "receiptline";

const display: Printer = {
  cpl: 42,
  encoding: "multilingual",
};

export const getHistoryReceipt = async (
  historyId: string,
  display: Printer,
) => {
  const orderHistory = await dexie.orderHistory.get(historyId);
  if (!orderHistory) return "";

  const orderVariants = await dexie.orderVariants
    .where("orderHistoryId")
    .equals(historyId)
    .and((a) => !a.deleted)
    .toArray();

  const discounts = await dexie.discounts
    .where("orderHistoryId")
    .equals(historyId)
    .and((a) => !a.deleted)
    .toArray();

  const costs = await dexie.costs
    .where("orderHistoryId")
    .equals(historyId)
    .and((a) => !a.deleted)
    .toArray();

  let s = "";
  for (const element of orderVariants) {
    const variant = productVariants$[element.variant_id]!.get();
    const product = products$[variant.product_id]!.get();
    const addons = await dexie.orderVariantAddons
      .where("orderVariantId")
      .equals(element.id)
      .and((a) => !a.deleted)
      .toArray();

    s += `${product.name} ${variant.name} | ${element.qty} | ${toRupiah(element.price * element.qty)}\n`;

    for (const addon of addons) {
      const av = addonValues$[addon.addonValueId]!.get();
      const a = addons$[av.addon_id]!.get();

      s += `${a.name + " " + av.name} | ${addon.qty + " x " + element.qty} | ${toRupiah(av.price * addon.qty * element.qty)}\n`;
    }

    s += "\n";
  }

  let d = "";
  for (const discount of discounts) {
    d += `Diskon ${discount.name} ${discount.type === "percent" ? discount.value + "%" : ""} | - ${discount.type === "percent" ? toRupiah(discount.value * 0.01 * orderHistory.totalBeforeDiscount) : toRupiah(discount.value)}\n`;
  }
  for (const discount of costs) {
    d += `Biaya ${discount.name} ${discount.type === "percent" ? discount.value + "%" : ""} | ${discount.type === "percent" ? toRupiah(discount.value * 0.01 * orderHistory.totalAfterDiscount) : toRupiah(discount.value)}\n`;
  }

  const markdown = `^^^RECEIPT
-
{code:https://cetakisme.com; option:qrcode,3,L}

Cetakisme
Lingkungan IV, Tumumpa Dua, Kec. Tuminting, Kota Manado, Sulawesi Utara 95239
${moment(new Date()).format("DD/MM/YYYY, hh:mm A")}
-

  ${s}
  ${d}
---
Total | ${toRupiah(orderHistory.total)}
Bayar | ${toRupiah(orderHistory.paid)}
Kembalian | ${orderHistory.paid > orderHistory.total ? toRupiah(orderHistory.paid - orderHistory.total) : toRupiah(0)}

Terima Kasih

Kunjungi Website Kami di www.cetakisme.com
`;

  return receiptline.transform(markdown, display);
};

const Resi: React.FC<{ id: string }> = ({ id }) => {
  const svg = useObservable("");

  useMount(async () => {
    const s = await getHistoryReceipt(id, display);
    svg.set(s);
  });

  return (
    <ScrollArea className="h-screen p-8">
      <div className="flex justify-center">
        <Memo>{() => <HtmlRenderer htmlString={svg.get()} />}</Memo>
      </div>
    </ScrollArea>
  );
};

function HtmlRenderer({ htmlString }: { htmlString: string }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
}

export default Resi;
