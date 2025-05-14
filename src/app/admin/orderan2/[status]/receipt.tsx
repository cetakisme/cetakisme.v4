/// <reference types="web-bluetooth" />

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toRupiah } from "@/lib/utils";
import { dexie } from "@/server/local/dexie";
import type { SavedOrder } from "@prisma/client";
import { DateTime } from "luxon";
import React from "react";
import receiptline, { type Printer } from "receiptline";
import { getDiscount } from "../../pos/kasir2/kasir-product-table";
import { toast } from "sonner";
import moment from "moment";

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
  return content.replace("$DISKON", data);
}

function transformBiayaString(content: string, data: string) {
  return content.replace("$BIAYA", data);
}

function transformTotalString(content: string, data: string) {
  return content.replace("$TOTAL", data);
}

function transformHistoryString(content: string, data: string) {
  return content.replace("$HISTORY", data);
}

function normalizeNewlines(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n");
}

function takeBeforeId<TData extends { id: string }>(
  arr: TData[],
  targetId: string,
): TData[] {
  const result: TData[] = [];
  for (const item of arr) {
    result.push(item);
    if (item.id === targetId) break;
  }
  return result;
}

const display: Printer = {
  cpl: 42,
  encoding: "multilingual",
};

const getHistoryReceipt = async (order: SavedOrder): Promise<string> => {
  const products = await dexie.savedOrderProducts
    .where("id")
    .anyOf(order.savedOrderProductsId)
    .toArray();

  const costs = await dexie.savedCosts
    .where("id")
    .anyOf(order.costsId)
    .toArray();

  const discounts = await dexie.savedDiscounts
    .where("id")
    .anyOf(order.discountsId)
    .toArray();

  const newOrder = await dexie.newOrders.get(order.newOrderId);
  if (!newOrder) return "Order Not Found";

  const orders = await dexie.savedOrders
    .where("id")
    .anyOf(newOrder.savedOrdersId)
    .filter((x) => !x.deleted)
    .sortBy("creteadAt");

  console.log(orders);

  const paidHistory = takeBeforeId(orders, order.id).map((x) => x.paid);

  const prepareProductsWithAdons = products.map(async (x) => {
    const addons = await dexie.savedAddons.where("id").anyOf(x.addon).toArray();
    const distinctAddonsWithQty = Object.values(
      addons.reduce(
        (acc, addon) => {
          const key = addon.addonValueId;
          if (!acc[key]) {
            acc[key] = { ...addon, qty: 1 };
          } else {
            acc[key].qty += 1;
          }
          return acc;
        },
        {} as Record<string, (typeof addons)[number] & { qty: number }>,
      ),
    );

    return {
      ...x,
      addons: distinctAddonsWithQty,
    };
  });

  const productWithAddons = await Promise.all(prepareProductsWithAdons);

  let total = 0;
  let saving = 0;

  let p = "";
  let d = "";
  let b = "";
  let t = "";
  let h = "";

  for (const product of productWithAddons) {
    p += `${product.name} | ${product.qty} | ${toRupiah(product.price * product.qty)}\n`;
    total += product.qty * product.price;

    for (const addon of product.addons) {
      p += `${addon.name} | ${addon.qty} x ${product.qty} | ${toRupiah(addon.price * addon.qty * product.qty)}\n`;
      total += product.qty * addon.price * addon.qty;
    }

    if (product.isDiscounted) {
      const discount =
        getDiscount(
          product.discountType as "flat" | "percent",
          product.price,
          product.discountValue,
        ) * product.qty;

      saving += discount;

      p += `Diskon ${product.discountName} ${product.discountType === "percent" ? product.discountValue + "%" : ""} | - ${toRupiah(
        discount,
      )}\n\n`;
    } else {
      p += "\n\n";
    }
  }

  for (const discount of discounts) {
    const price = getDiscount(
      discount.type as "flat" | "percent",
      order.totalProducts,
      discount.value,
    );
    saving += price;
    d += `Diskon ${discount.name} ${discount.type === "percent" ? discount.value + "%" : ""} | - ${toRupiah(price)}\n`;
  }

  for (const cost of costs) {
    const price = getDiscount(
      cost.type as "flat" | "percent",
      order.totalProducts - order.totalDiscounts,
      cost.value,
    );
    total += price;
    b += `Biaya ${cost.name} ${cost.type === "percent" ? cost.value + "%" : ""} | ${toRupiah(price)}\n`;
  }

  t += `Total Produk | ${toRupiah(total)}\n`;
  if (saving !== 0) t += `Total Saving | ${toRupiah(saving)}\n`;
  t += `Total Akhir | ${toRupiah(total - saving)}\n`;

  let i = 1;
  let pass = 1;
  let lastCicil = 0;
  let kembalian = "";
  for (const paid of paidHistory) {
    if (i === paidHistory.length) {
      if (paid >= total - saving) {
        h += `Lunas | ${toRupiah(paid - lastCicil)}\n`;
        if (paid - (total - saving) > 0) {
          kembalian += `Kembalian | ${toRupiah(paid - (total - saving))}\n`;
        }
      } else if (paid < total - saving) {
        if (i === 1) {
          h += `DP | ${toRupiah(paid)}\n`;
        } else {
          h += `Cicil ${i - pass} | ${toRupiah(paid - lastCicil)}\n`;
        }
      }
      h += `Total Bayar | ${toRupiah(paid)}\n`;
      if (paid < total - saving) {
        h += `Hutang | ${toRupiah(total - saving - paid)}\n`;
      }
      if (kembalian !== "") {
        h += kembalian;
      }
    } else {
      if (paid === lastCicil) {
        i++;
        pass++;
      } else {
        if (paid >= total - saving) {
          h += `Lunas | ${toRupiah(paid - lastCicil)}\n`;
          if (paid - total - saving > 0) {
            h += `Kembalian | ${toRupiah(paid - total - saving)}\n`;
          }
        } else if (paid < total - saving) {
          if (i === 1) {
            h += `DP | ${toRupiah(paid)}\n`;
          } else {
            h += `Cicil ${i - pass} | ${toRupiah(paid - lastCicil)}\n`;
          }
        }

        lastCicil = paid;
        i++;
      }
    }
  }

  const markdown = `^^^Cetakisme^^^^
   ---
  ${p}${d !== "" ? "\n" + d : ""}${b !== "" ? "\n" + b : ""}
  ---
  
  ${t}${h !== "" ? "\n" + h : ""}

  Terima Kasih`;

  const model = await dexie.receiptSettings.toArray();

  if (model[0]) {
    const modelMarkdown = await dexie.receiptModel.get(model[0].model);
    if (!modelMarkdown) {
      return receiptline.transform(markdown, display);
    } else {
      let md = modelMarkdown.content;
      md = transformQRString(md);
      md = transformTanggalString(md);
      md = transformBarangString(md, p);
      md = transformDiskonString(md, d);
      md = transformBiayaString(md, b);
      md = transformTotalString(md, t);
      md = transformHistoryString(md, h);
      md = normalizeNewlines(md);

      return receiptline.transform(md, display);
    }
  } else {
    return receiptline.transform(markdown, display);
  }
};

const Receipt: React.FC<{
  order: SavedOrder | null;
  onDelete: (savedOrderId: string) => void;
}> = ({ order, onDelete }) => {
  const [svg, setSvg] = React.useState("");

  React.useEffect(() => {
    if (!order) return;

    const f = async () => {
      const s = await getHistoryReceipt(order);
      setSvg(s);
    };

    void f();
  }, [order]);
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Lihat Resi</Button>
        </DialogTrigger>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[600px] pr-8">
            <HtmlRenderer htmlString={svg} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Button
        className="w-full"
        onClick={async () => {
          downloadPNGFromSVG(svg, (pngUrl) => {
            void sendToPrinter(pngUrl);
          });
        }}
      >
        Print Resi
      </Button>
      <Button
        className="w-full"
        onClick={async () => {
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
          if (!order) return;

          const newOrder = await dexie.newOrders.get(order.newOrderId);
          if (!newOrder) return;
          const customer = await dexie.customers.get(newOrder?.customer_id);

          downloadPNGFromSVG(svg, (pngUrl) => {
            const link = document.createElement("a");
            link.href = pngUrl;
            link.download = `Resi ${customer?.name ?? "No Name"} - ${moment(order.creteadAt).format("DD MMM YYYY")}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });
        }}
      >
        Download Resi
      </Button>
      <Button
        variant={"destructive"}
        className="mt-12"
        onClick={() => {
          if (!order) return;
          onDelete(order.id);
        }}
      >
        Hapus Histori
      </Button>
    </>
  );
};

export default Receipt;

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
  } catch {
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
