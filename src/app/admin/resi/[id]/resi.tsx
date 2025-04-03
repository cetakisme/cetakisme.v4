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

  const histories = await dexie.orderHistory
    .where("orderId")
    .equals(orderHistory.orderId)
    .sortBy("created_at");

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

  let lastPrice = 0;
  const prices = histories
    .map((x) => {
      const p = x.paid - lastPrice;
      lastPrice = p;
      return { price: p, type: x.payment_provider };
    })
    .filter((x) => x.price !== 0);

  let h = "";

  for (let i = 0; i < prices.length; i++) {
    const element = prices[i]!;
    if (i === 0 && i === prices.length - 1) {
      if (orderHistory.total - element.price <= 0) {
        h += `Lunas (${element.type}) | ${toRupiah(element.price)}\n`;
        continue;
      } else {
        h += `DP (${element.type}) | ${toRupiah(element.price)}\n`;
        h += `Utang (${element.type}) | ${toRupiah(orderHistory.total - element.price)}\n`;
      }
      continue;
    }

    if (i === 0) {
      h += `DP (${element.type}) | ${toRupiah(element.price)}\n`;
      continue;
    }

    if (i === prices.length - 1) {
      if (orderHistory.paid < orderHistory.total) {
        h += `Utang (${element.type}) | ${toRupiah(orderHistory.total - element.price)}\n`;
        continue;
      } else if (orderHistory.paid >= orderHistory.total) {
        h += `Lunas (${element.type}) | ${toRupiah(element.price)}\n`;
        h += `Kembalian | ${toRupiah(orderHistory.paid - orderHistory.total)}\n`;
        continue;
      }
    }

    h += `Cicilan ${i + 1} | ${toRupiah(element.price)}\n`;
  }

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
${h}
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
