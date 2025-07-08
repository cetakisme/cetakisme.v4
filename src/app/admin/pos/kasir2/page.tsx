"use client";

// import Title from "@/components/hasan/title";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useContext, useState } from "react";
import { SelectCustomer } from "./select-customer";
import Inventory from "./inventory-product";
import KasirProductTable from "./kasir-product-table";
import ActionButtons from "./action-buttons";
import Totals from "./totals";
import DiscountCosts from "./discount-costs";
import { useSearchParams } from "next/navigation";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LucideArrowLeftRight } from "lucide-react";
// import Conditional from "@/components/hasan/conditional";
import { Scrollbar } from "@radix-ui/react-scroll-area";
import { ContentLayout } from "@/components/admin-panel/content-layout";

const Page = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <ContentLayout title="POS">
      <ContextProvider>
        <P orderId={orderId} />
        <Mobile orderId={orderId} />
      </ContextProvider>
    </ContentLayout>
  );
};

export default Page;

type Context = {
  value: string;
  setValue: (v: string) => void;
};

const MobileContext = React.createContext<Context | undefined>(undefined);

const ContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [value, setValue] = useState("kasir");
  return (
    <MobileContext.Provider value={{ value, setValue }}>
      {children}
    </MobileContext.Provider>
  );
};

const useContextProvider = () => {
  const ctx = useContext(MobileContext);
  if (!ctx) throw new Error("Error");
  return ctx;
};

const Mobile = ({ orderId }: { orderId: string | null }) => {
  const { value, setValue } = useContextProvider();
  return (
    <div className="flex flex-col lg:hidden">
      <div className="text-2xl font-bold">
        Kasir{" "}
        <Button
          className="p-0"
          size={"icon"}
          variant={"outline"}
          onClick={() => {
            if (value === "kasir") {
              setValue("barang");
            } else {
              setValue("kasir");
            }
          }}
        >
          <LucideArrowLeftRight />
        </Button>
      </div>
      {value === "kasir" ? (
        <ScrollArea className="flex h-screen flex-1 flex-col pt-4">
          <SelectCustomer />
          <ScrollArea className="flex-1">
            <div className="">
              <KasirProductTable orderId={orderId} />
              <DiscountCosts />
            </div>
          </ScrollArea>
          <div className="space-y-2 pb-2">
            <Totals />
            <ActionButtons />
            <Scrollbar orientation="horizontal" className="h-4" />
          </div>
        </ScrollArea>
      ) : (
        <Inv />
      )}
    </div>
  );
};

const P = ({ orderId }: { orderId: string | null }) => {
  return (
    <div className="hidden lg:block">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>
          <POS orderId={orderId} />
        </ResizablePanel>
        <ResizablePanel>
          <Inv />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

const POS = ({ orderId }: { orderId: string | null }) => {
  return (
    <div className="flex h-screen w-full flex-col lg:p-8 lg:pr-2">
      <SelectCustomer />
      <ScrollArea className="flex-1 px-4">
        <div className="pr-4">
          <KasirProductTable orderId={orderId} />
          <DiscountCosts />
        </div>
      </ScrollArea>
      <div className="space-y-2 px-4">
        <Totals />
        <ActionButtons />
      </div>
    </div>
  );
};

const Inv = () => {
  return (
    <div className="px-2 pt-4">
      <Inventory />
    </div>
  );
};
