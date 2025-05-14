"use client";

import Title from "@/components/hasan/title";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";
import { SelectCustomer } from "./select-customer";
import Inventory from "./inventory-product";
import KasirProductTable from "./kasir-product-table";
import ActionButtons from "./action-buttons";
import Totals from "./totals";
import DiscountCosts from "./discount-costs";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const Page = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>
        <div className="flex h-screen flex-col p-8 pr-1">
          <Title>Kasir</Title>
          <SelectCustomer />
          <ScrollArea className="flex-1">
            <div className="pr-4">
              <KasirProductTable orderId={orderId} />
              <DiscountCosts />
            </div>
          </ScrollArea>
          <div className="space-y-2">
            <Totals />
            <ActionButtons />
          </div>
        </div>
      </ResizablePanel>
      <ResizablePanel>
        <div className="p-8 pl-1">
          <Inventory />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Page;
