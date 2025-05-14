"use client";

import React from "react";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { Memo, useMount, useObservable } from "@legendapp/state/react";
import receiptline, { type Printer } from "receiptline";
import { receiptModels$ } from "@/server/local/db";
import { dexie } from "@/server/local/dexie";
import { type ReceiptModel } from "@prisma/client";
import Title from "@/components/hasan/title";
import { DateTime } from "luxon";
import { toRupiah } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { user$ } from "@/server/local/auth";

const Resi: React.FC<{ id: string }> = ({ id }) => {
  const ctx$ = useObservable<ReceiptModel>({
    id: "",
    content: "",
    deleted: false,
    name: "",
  });

  useMount(async () => {
    const receipt = await dexie.receiptModel.get(id);
    if (!receipt) return;
    ctx$.set(receipt);
  });

  return (
    <ResizablePanelGroup direction="horizontal" className="p-8">
      <ResizablePanel defaultSize={50}>
        <div className="p-1">
          <Title>
            <Memo>{() => ctx$.name.get()}</Memo>
          </Title>
          <Memo>
            {() => (
              <Textarea
                key={ctx$.id.get()}
                rows={20}
                defaultValue={ctx$.content.get()}
                onBlur={(e) => {
                  receiptModels$[ctx$.id.get()]!.content.set(e.target.value);
                  ctx$.content.set(e.target.value);
                }}
              />
            )}
          </Memo>
        </div>
      </ResizablePanel>
      <ResizablePanel defaultSize={50}>
        <div className="p-1">
          <Memo>{() => <Receipt content={ctx$.content.get()} />}</Memo>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Resi;

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

function transformBarangString(content: string) {
  return content.replace(
    "$BARANG",
    `T-Shirt | 1 | ${toRupiah(30000)}
    Polyflex A1 | 1 x 1 | ${toRupiah(30000)}
    Diskon 10% | ${toRupiah(3000)}
    
    Long Sleeve | 2 | ${toRupiah(30000)}
    Polyflex A2 | 1 x 2 | ${toRupiah(30000)}
    `,
  );
}

function transformDiskonString(content: string) {
  return content.replace("$DISKON", `Diskon 10% | ${toRupiah(30000)}`);
}

function transformBiayaString(content: string) {
  return content.replace("$BIAYA", `Biaya Ongkir | ${toRupiah(30000)}`);
}

function transformTotalString(content: string) {
  return content.replace(
    "$TOTAL",
    `Total Produk | ${toRupiah(30000)}
    Total Saving | ${toRupiah(30000)}
    Total Akhir | ${toRupiah(30000)}`,
  );
}

function transformHistoryString(content: string) {
  return content.replace(
    "$HISTORY",
    `DP | ${toRupiah(30000)}
    Cicil 1 | ${toRupiah(30000)}
    Lunas | ${toRupiah(30000)}
  `,
  );
}

function transformUserString(content: string) {
  return content.replace("$USER", `${user$.name.get()}`);
}

const constructReceipt = (content: string) => {
  const display: Printer = {
    cpl: 42,
    encoding: "multilingual",
  };

  let markdown = content;
  markdown = transformQRString(markdown);
  markdown = transformTanggalString(markdown);
  markdown = transformBarangString(markdown);
  markdown = transformDiskonString(markdown);
  markdown = transformTotalString(markdown);
  markdown = transformHistoryString(markdown);
  markdown = transformUserString(markdown);
  markdown = transformBiayaString(markdown);

  return receiptline.transform(markdown, display);
};

const Receipt: React.FC<{ content: string }> = ({ content }) => {
  const receipt = constructReceipt(content);
  return (
    <ScrollArea className="flex h-screen justify-center">
      <HtmlRenderer htmlString={receipt} />
    </ScrollArea>
  );
};

function HtmlRenderer({ htmlString }: { htmlString: string }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
}
