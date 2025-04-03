/// <reference types="web-bluetooth" />

import { toRupiah } from "@/lib/utils";
import {
  addons$,
  addonValues$,
  customer$,
  orders$,
  products$,
  productVariants$,
  receiptModels$,
} from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { OrderHistory } from "@prisma/client";
import { DateTime } from "luxon";
import moment from "moment";
import React from "react";
import receiptline, { Printer } from "receiptline";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import {
  Memo,
  useMount,
  useObservable,
  useObserveEffect,
} from "@legendapp/state/react";
import { DialogDescription, DialogProps } from "@radix-ui/react-dialog";
import { DB } from "@/lib/supabase/supabase";
import { Button } from "../ui/button";
import { toast } from "sonner";

const getHistoryReceipt = async (
  orderHistory: DB<"OrderHistory">,
  display: Printer,
) => {
  const histories = await dexie.orderHistory
    .where("orderId")
    .equals(orderHistory.orderId)
    .sortBy("created_at");

  const orderVariants = await dexie.orderVariants
    .where("orderHistoryId")
    .equals(orderHistory.id)
    .and((a) => !a.deleted)
    .toArray();

  const discounts = await dexie.discounts
    .where("orderHistoryId")
    .equals(orderHistory.id)
    .and((a) => !a.deleted)
    .toArray();

  const costs = await dexie.costs
    .where("orderHistoryId")
    .equals(orderHistory.id)
    .and((a) => !a.deleted)
    .toArray();

  let lastPrice = 0;
  const prices = histories
    .filter(
      (history) =>
        new Date(history.created_at).getTime() <=
        new Date(orderHistory.created_at).getTime(),
    )
    .map((x) => {
      const p = x.paid - lastPrice;
      lastPrice = p;
      return { price: p, type: x.payment_provider };
    })
    .filter((x) => x.price !== 0);

  let h = "";

  if (prices.length === 0) {
    if (orderHistory.total < orderHistory.paid) {
      h += `Lunas (${orderHistory.payment_type}) | ${toRupiah(orderHistory.paid)}\n`;
      h += `Kembalian | ${toRupiah(orderHistory.paid - orderHistory.total)}\n`;
    } else {
      h += `DP (${orderHistory.payment_type}) | ${toRupiah(orderHistory.paid)}\n`;
      h += `Utang (${orderHistory.payment_type}) | ${toRupiah(orderHistory.total - orderHistory.paid)}\n`;
    }
  } else {
    for (let i = 0; i < prices.length; i++) {
      const element = prices[i]!;
      if (i === 0 && i === prices.length - 1) {
        if (orderHistory.total - element.price <= 0) {
          h += `Lunas (${element.type}) | ${toRupiah(element.price)}\n`;
          h += `Kembalian | ${toRupiah(element.price - orderHistory.total)}\n`;
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

  const fallback = `^^^RECEIPT
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

  const model = await dexie.receiptSettings.toArray();

  if (model[0]) {
    let markdown = await receiptModels$[model[0].model]!.content.get();
    markdown = transformQRString(markdown);
    markdown = transformTanggalString(markdown);
    markdown = transformBarangString(markdown, s);
    markdown = transformDiskonString(markdown, d);
    markdown = transformTotalString(markdown, orderHistory.total);
    markdown = transformHistoryString(markdown, h);

    return receiptline.transform(markdown, display);
  } else {
    return receiptline.transform(fallback, display);
  }
};

function transformQRString(qr: string) {
  return qr.replace(/\$QR\{\s*"([^"]+)"\}/, `{code:$1; option:qrcode,4,L}`);
}

function transformTanggalString(qr: string) {
  return qr.replace(
    "$TANGGAL",
    DateTime.now()
      .setZone("Asia/Singapore")
      .toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
  );
}

function transformBarangString(content: string, data: string) {
  return content.replace("$BARANG", data);
}

function transformDiskonString(content: string, data: string) {
  return content.replace("$DISKON-BIAYA", data);
}

function transformTotalString(content: string, total: number) {
  return content.replace("$TOTAL", `Total | ${toRupiah(total)}`);
}

function transformHistoryString(content: string, data: string) {
  return content.replace("$HISTORY", data);
}

const display: Printer = {
  cpl: 42,
  encoding: "multilingual",
};

const ResiDialog: React.FC<{ history: DB<"OrderHistory"> } & DialogProps> = ({
  history,
  ...props
}) => {
  return (
    <Dialog {...props}>
      <Content history={history} />
    </Dialog>
  );
};

const Content: React.FC<{ history: DB<"OrderHistory"> } & DialogProps> = ({
  history,
}) => {
  const svg = useObservable("");

  useObserveEffect(async () => {
    const s = await getHistoryReceipt(history, display);
    svg.set(s);
  });
  return (
    <DialogContent className="max-w-fit">
      <DialogTitle></DialogTitle>
      <DialogDescription></DialogDescription>
      <ScrollArea className="max-h-[600px] pr-8">
        <div className="space-y-2">
          <Memo>{() => <HtmlRenderer htmlString={svg.get()} />}</Memo>
          <Button
            className="w-full"
            onClick={async () => {
              downloadPNGFromSVG(svg.get(), (pngUrl) => {
                sendToPrinter(pngUrl);
              });
            }}
          >
            Print Resi
          </Button>
          <Button
            className="w-full"
            onClick={async () => {
              downloadPNGFromSVG(svg.get(), (pngUrl) => {
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
              const order = orders$[history.orderId]!.get();
              const customer = customer$[order.customer_id]!.get();

              downloadPNGFromSVG(svg.get(), (pngUrl) => {
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
    </DialogContent>
  );
};

export default ResiDialog;

function HtmlRenderer({ htmlString }: { htmlString: string }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
}

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
